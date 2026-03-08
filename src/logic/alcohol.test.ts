import { describe, expect, it } from 'vitest';

import { calculatePureAlcohol } from './alcohol';

describe('calculatePureAlcohol', () => {
  it('ビール中ジョッキが16gになる', () => {
    expect(calculatePureAlcohol(400, 5)).toBe(16);
  });

  it('ハイボール・サワーが19.6gになる', () => {
    expect(calculatePureAlcohol(350, 7)).toBe(19.6);
  });
});
