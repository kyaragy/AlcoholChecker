import type { DrinkEntry, DrinkPreset, StateLabel } from '../types/models';

export interface ChaserRecommendation {
  level: 'none' | 'normal' | 'strong';
  message: string;
}

function isAlcohol(drinkId: DrinkPreset['id'], presets: DrinkPreset[]): boolean {
  const preset = presets.find((item) => item.id === drinkId);
  return Boolean(preset && preset.alcoholPercent > 0);
}

export function detectChaserRecommendation(
  entries: DrinkEntry[],
  presets: DrinkPreset[],
  stateLabel: StateLabel
): ChaserRecommendation {
  const alcoholCount = entries.filter((entry) => isAlcohol(entry.drinkId, presets)).length;
  const waterCount = entries.filter((entry) => entry.drinkId === 'water').length;

  if (alcoholCount === 0) {
    return { level: 'none', message: 'まだ記録がありません。' };
  }

  const lackOfWater = waterCount < alcoholCount;
  const lastTwo = entries.slice(-2);
  const consecutiveAlcohol =
    lastTwo.length === 2 &&
    lastTwo.every((entry) => isAlcohol(entry.drinkId, presets)) &&
    waterCount === 0;

  if (stateLabel === '飲み過ぎ注意' || stateLabel === 'かなり飲み過ぎ') {
    return { level: 'strong', message: '飲酒量が多めです。水を飲むまで次の酒は控えよう。' };
  }

  if (consecutiveAlcohol) {
    return { level: 'strong', message: '酒が続いています。次は必ず水を1杯飲もう。' };
  }

  if (lackOfWater) {
    return { level: 'normal', message: '次は水を1杯飲もう。' };
  }

  return { level: 'none', message: 'いいペースです。この調子でゆっくり。' };
}
