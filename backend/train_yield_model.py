"""Train a country-level FAOSTAT yield baseline with a chronological holdout."""
from pathlib import Path
import argparse, json, zipfile
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


def load_csv(path):
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as z:
            csvs = [n for n in z.namelist() if n.lower().endswith('.csv')]
            if not csvs: raise ValueError('No CSV in ZIP')
            with z.open(csvs[0]) as f: return pd.read_csv(f, low_memory=False)
    return pd.read_csv(path, low_memory=False)


def train(path, output):
    df = load_csv(path)
    required = {'Area','Item','Year','Element','Unit','Value'}
    if not required.issubset(df): raise ValueError(f'Missing columns: {required-set(df)}')
    df = df[(df['Element']=='Yield') & (df['Unit']=='kg/ha')].copy()
    df['Value'] = pd.to_numeric(df['Value'], errors='coerce')
    df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
    df = df.dropna(subset=['Area','Item','Year','Value'])
    df = df[(df['Value']>0) & (df['Year'].between(2015,2024))].copy()
    df['Year'] = df['Year'].astype(int)
    df = df.drop_duplicates(subset=['Area','Item','Year'],keep='last')
    train = df[df.Year<=2022].copy()
    test = df[df.Year>=2023].copy()
    if train.empty or test.empty: raise ValueError('Insufficient chronological train/test records')
    cols=['Area','Item','Year']
    preprocess = ColumnTransformer([
        ('category',OneHotEncoder(handle_unknown='ignore'),['Area','Item']),
        ('year',StandardScaler(),['Year'])
    ])
    model = Pipeline([('preprocess',preprocess),('regressor',Ridge(alpha=50.0))])
    model.fit(train[cols], np.log1p(train.Value))
    pred=np.maximum(0,np.expm1(model.predict(test[cols])))
    # Last observed country/crop yield is a strong, simple benchmark.
    last=train.sort_values('Year').drop_duplicates(['Area','Item'],keep='last').set_index(['Area','Item'])['Value']
    crop_median=train.groupby('Item')['Value'].median()
    overall=float(train.Value.median())
    baseline=np.array([last.get((r.Area,r.Item),crop_median.get(r.Item,overall)) for r in test.itertuples()])
    def metrics(yhat):
        return {'mae_kg_ha':round(float(mean_absolute_error(test.Value,yhat)),2),
                'rmse_kg_ha':round(float(np.sqrt(mean_squared_error(test.Value,yhat))),2),
                'r2':round(float(r2_score(test.Value,yhat)),4)}
    report={'dataset':'FAOSTAT yield (kg/ha)','scope':'country-level, not field-level',
            'training_years':'2015–2022','test_years':'2023–2024',
            'train_rows':len(train),'test_rows':len(test),
            'ridge_model':metrics(pred),'last_observed_baseline':metrics(baseline),
            'inputs':['Area','Item','Year'],
            'limitations':'No soil, GPS, NASA climate or farm management features in this model.'}
    output.mkdir(parents=True,exist_ok=True)
    joblib.dump({'model':model,'known_areas':sorted(train.Area.unique().tolist()),
                 'known_crops':sorted(train.Item.unique().tolist()),'train_max_year':2022,
                 'unit':'kg/ha'},output/'faostat_yield_model.joblib')
    (output/'evaluation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('dataset',type=Path,help='FAOSTAT CSV or ZIP')
    parser.add_argument('--output',type=Path,default=Path('models'))
    args=parser.parse_args()
    train(args.dataset,args.output)
