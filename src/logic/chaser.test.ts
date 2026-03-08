import { describe, expect, it } from 'vitest';

import { DRINK_PRESETS } from '../constants/presets';
import { detectChaserRecommendation } from './chaser';

describe('detectChaserRecommendation', () => {
  it('酒1杯で水を推奨', () => {
    const entries = [{ id: '1', drinkId: 'beerMedium' as const, timestamp: Date.now() }];
    expect(detectChaserRecommendation(entries, DRINK_PRESETS, '軽く回ってきた').level).toBe('normal');
  });

  it('酒2杯連続で強く推奨', () => {
    const entries = [
      { id: '1', drinkId: 'beerMedium' as const, timestamp: Date.now() - 1000 },
      { id: '2', drinkId: 'highballSour' as const, timestamp: Date.now() }
    ];
    expect(detectChaserRecommendation(entries, DRINK_PRESETS, 'ほろ酔い').level).toBe('strong');
  });
});
