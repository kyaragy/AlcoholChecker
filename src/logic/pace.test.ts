import { describe, expect, it } from 'vitest';

import { DRINK_PRESETS } from '../constants/presets';
import { detectPaceWarning } from './pace';

const now = new Date('2026-03-08T20:00:00+09:00').getTime();

describe('detectPaceWarning', () => {
  it('15分以内2杯でペース注意', () => {
    const entries = [
      { id: '1', drinkId: 'beerMedium' as const, timestamp: now - 10 * 60 * 1000 },
      { id: '2', drinkId: 'highballSour' as const, timestamp: now - 5 * 60 * 1000 }
    ];
    expect(detectPaceWarning(entries, DRINK_PRESETS, 15, 30, now).level).toBe('fast');
  });

  it('30分以内3杯でかなりハイペース', () => {
    const entries = [
      { id: '1', drinkId: 'beerMedium' as const, timestamp: now - 25 * 60 * 1000 },
      { id: '2', drinkId: 'highballSour' as const, timestamp: now - 20 * 60 * 1000 },
      { id: '3', drinkId: 'beerLarge' as const, timestamp: now - 3 * 60 * 1000 }
    ];
    expect(detectPaceWarning(entries, DRINK_PRESETS, 15, 30, now).level).toBe('veryFast');
  });
});
