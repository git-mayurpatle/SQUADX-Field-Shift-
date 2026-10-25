export const SOIL_PRACTICES = [
  { id: 'coverCrop', label: 'Grow a cover crop during bare-soil periods' },
  { id: 'residueRetention', label: 'Retain crop residues instead of burning/removing them' },
  { id: 'legumeRotation', label: 'Include a legume in the recent crop rotation' },
  { id: 'reducedTillage', label: 'Use reduced or minimum tillage' },
];

export function getPracticeAdoptionIndex(practices = {}) {
  if (!practices || typeof practices !== 'object') return null;

  const recorded = SOIL_PRACTICES
    .map(({ id }) => practices[id])
    .filter((value) => typeof value === 'boolean');

  if (!recorded.length) return null;

  const adopted = recorded.filter(Boolean).length;
  return {
    score: Math.round((adopted / recorded.length) * 100),
    adopted,
    recorded: recorded.length,
    total: SOIL_PRACTICES.length,
  };
}

export function getErosionExposureIndex({ slopePercent, groundCoverPercent, rainfall90DayMm }) {
  if (
    !Number.isFinite(slopePercent)
    || slopePercent < 0
    || slopePercent > 100
    || !Number.isFinite(groundCoverPercent)
    || groundCoverPercent < 0
    || groundCoverPercent > 100
    || !Number.isFinite(rainfall90DayMm)
    || rainfall90DayMm < 0
  ) {
    return null;
  }

  const slopeExposure = Math.min(slopePercent / 15, 1) * 100;
  const bareGroundExposure = 100 - groundCoverPercent;
  const recentRainExposure = Math.min(rainfall90DayMm / 500, 1) * 100;
  const index = Math.round(
    slopeExposure * 0.4
    + bareGroundExposure * 0.35
    + recentRainExposure * 0.25,
  );

  return {
    score: index,
    factors: {
      slopeExposure: Math.round(slopeExposure),
      bareGroundExposure: Math.round(bareGroundExposure),
      recentRainExposure: Math.round(recentRainExposure),
    },
  };
}
