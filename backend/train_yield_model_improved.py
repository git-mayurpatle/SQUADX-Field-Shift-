"""FAOSTAT country/crop yield forecasting with leakage-safe historical features.

Train on historical forecast origins up to 2020, validate using origin 2021,
and evaluate once using origin 2022 to predict 2023 and 2024.
"""
from pathlib import Path
import argparse
import json
import zipfile
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

KEYS = ['Area', 'Item']
NUMERIC = ['origin_year', 'horizon', 'last_yield', 'mean3', 'mean5', 'trend3', 'n_history', 'crop_median']
FEATURES = KEYS + NUMERIC


def load_csv(path):
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as archive:
            names = [name for name in archive.namelist() if name.lower().endswith('.csv')]
            if not names:
                raise ValueError('No CSV in ZIP')
            with archive.open(names[0]) as stream:
                return pd.read_csv(stream, low_memory=False)
    return pd.read_csv(path, low_memory=False)


def prepare(path):
    df = load_csv(path)
    required = {'Area', 'Item', 'Year', 'Element', 'Unit', 'Value'}
    if not required.issubset(df.columns):
        raise ValueError(f'Missing columns: {required - set(df.columns)}')
    df = df.loc[(df.Element == 'Yield') & (df.Unit == 'kg/ha')].copy()
    df['Year'] = pd.to_numeric(df.Year, errors='coerce')
    df['Value'] = pd.to_numeric(df.Value, errors='coerce')
    df = df.dropna(subset=['Area', 'Item', 'Year', 'Value'])
    df = df.loc[(df.Value > 0) & df.Year.between(2015, 2024)].copy()
    df['Year'] = df.Year.astype(int)
    return df.sort_values('Year').drop_duplicates(KEYS + ['Year'], keep='last')


def origin_rows(df, origin, horizons=(1, 2)):
    history = df.loc[df.Year <= origin]
    if history.empty:
        return pd.DataFrame()
    medians = history.groupby('Item').Value.median().to_dict()
    rows = []
    for (area, item), group in history.groupby(KEYS, sort=False):
        group = group.sort_values('Year')
        recent3 = group.tail(3)
        recent5 = group.tail(5)
        last = float(group.iloc[-1].Value)
        trend = 0.0
        if len(recent3) >= 2:
            x = recent3.Year.to_numpy(dtype=float)
            y = recent3.Value.to_numpy(dtype=float)
            if len(np.unique(x)) >= 2:
                trend = float(np.polyfit(x - x.min(), y, 1)[0])
        common = {
            'Area': area, 'Item': item, 'origin_year': origin,
            'last_yield': last, 'mean3': float(recent3.Value.mean()),
            'mean5': float(recent5.Value.mean()), 'trend3': trend,
            'n_history': len(group), 'crop_median': float(medians[item]),
        }
        for horizon in horizons:
            rows.append({**common, 'horizon': horizon, 'Year': origin + horizon})
    return pd.DataFrame(rows)


def make_examples(df, origins):
    actual = df[KEYS + ['Year', 'Value']]
    chunks = []
    for origin in origins:
        features = origin_rows(df, origin)
        if not features.empty:
            labeled = features.merge(actual, on=KEYS + ['Year'], how='inner')
            chunks.append(labeled)
    if not chunks:
        raise ValueError('No training examples available')
    return pd.concat(chunks, ignore_index=True)


def metrics(y, prediction):
    return {
        'mae_kg_ha': round(float(mean_absolute_error(y, prediction)), 2),
        'rmse_kg_ha': round(float(np.sqrt(mean_squared_error(y, prediction))), 2),
        'r2': round(float(r2_score(y, prediction)), 4),
    }


def build_model():
    transformer = ColumnTransformer([
        ('category', OneHotEncoder(handle_unknown='ignore'), KEYS),
        ('numeric', SimpleImputer(strategy='median'), NUMERIC),
    ])
    return Pipeline([
        ('features', transformer),
        ('regressor', RandomForestRegressor(
            n_estimators=160, min_samples_leaf=2, max_features=0.8,
            n_jobs=-1, random_state=42,
        )),
    ])


def evaluate(model, frame):
    pred = np.maximum(0, model.predict(frame[FEATURES]))
    baseline = frame.last_yield.to_numpy()
    return {'random_forest': metrics(frame.Value, pred),
            'last_observed_baseline': metrics(frame.Value, baseline)}


def train(path, output):
    df = prepare(path)
    training = make_examples(df, range(2017, 2021))  # origins 2017–2020
    validation = make_examples(df, [2021])  # forecast 2022/2023
    test = make_examples(df, [2022])  # forecast 2023/2024
    # Validation year 2022 is excluded from the initial training labels.
    training = training.loc[training.Year <= 2021]
    validation = validation.loc[validation.Year <= 2022]  # only 2022 validation target
    if training.empty or validation.empty or test.empty:
        raise ValueError('Not enough historical observations to train and evaluate')
    model = build_model()
    model.fit(training[FEATURES], training.Value)
    validation_scores = evaluate(model, validation)
    # Refit on pre-2023 targets only, after choosing fixed hyperparameters.
    combined = pd.concat([training, validation], ignore_index=True)
    final_model = build_model()
    final_model.fit(combined[FEATURES], combined.Value)
    test_scores = evaluate(final_model, test)
    report = {
        'dataset': 'FAOSTAT yield (kg/ha)',
        'scope': 'country/crop historical forecasts, not farm-level',
        'training_examples': len(combined), 'validation_examples': len(validation),
        'test_examples': len(test),
        'validation': validation_scores,
        'test_2023_2024': test_scores,
        'test_origin': 2022,
        'inputs': FEATURES,
        'recommended_predictor': (
            'random_forest' if test_scores['random_forest']['mae_kg_ha'] <
            test_scores['last_observed_baseline']['mae_kg_ha'] else 'last_observed_baseline'
        ),
        'limitations': 'No GPS, climate, soil or farm-level inputs. Testing uses historical 2022-origin forecasts; do not interpret as a validated 2026 forecast.',
    }
    output.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        'model': final_model, 'features': FEATURES,
        'known_areas': sorted(df.loc[df.Year <= 2022].Area.unique().tolist()),
        'known_crops': sorted(df.loc[df.Year <= 2022].Item.unique().tolist()),
        'train_max_year': 2022, 'unit': 'kg/ha',
        'historical_data': df.loc[df.Year <= 2022, KEYS + ['Year', 'Value']],
    }, output / 'faostat_yield_model_improved.joblib')
    (output / 'evaluation_improved.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('dataset', type=Path)
    parser.add_argument('--output', type=Path, default=Path('models'))
    args = parser.parse_args()
    train(args.dataset, args.output)
