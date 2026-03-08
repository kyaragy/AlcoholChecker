import { describe, expect, it } from 'vitest';

import { getStateLabel } from './state';

const thresholds = [15, 30, 50, 65];

describe('getStateLabel', () => {
  it('ビール中3杯(48g)がほろ酔いになる', () => {
    expect(getStateLabel(48, thresholds)).toBe('ほろ酔い');
  });

  it('ハイボール3杯(60g)が飲み過ぎ注意になる', () => {
    expect(getStateLabel(60, thresholds)).toBe('飲み過ぎ注意');
  });
});
