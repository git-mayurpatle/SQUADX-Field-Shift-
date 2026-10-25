import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getErosionExposureIndex,
  getPracticeAdoptionIndex,
} from './soilScreening.js';

describe('soil management practice index', () => {
  it('does not score unanswered practices', () => {
    assert.equal(getPracticeAdoptionIndex({}), null);
  });

  it('scores only answered practices', () => {
    assert.deepEqual(
      getPracticeAdoptionIndex({ coverCrop: true, residueRetention: false }),
      { score: 50, adopted: 1, recorded: 2, total: 4 },
    );
  });
});

describe('erosion exposure screen', () => {
  it('calculates the disclosed weighted relative index', () => {
    assert.deepEqual(
      getErosionExposureIndex({
        slopePercent: 7.5,
        groundCoverPercent: 60,
        rainfall90DayMm: 250,
      }),
      {
        score: 47,
        factors: {
          slopeExposure: 50,
          bareGroundExposure: 40,
          recentRainExposure: 50,
        },
      },
    );
  });

  it('requires valid field inputs and rainfall', () => {
    assert.equal(
      getErosionExposureIndex({
        slopePercent: 101,
        groundCoverPercent: 60,
        rainfall90DayMm: 250,
      }),
      null,
    );
  });
});
