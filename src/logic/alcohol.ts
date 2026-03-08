import type { DrinkEntry, DrinkPreset } from '../types/models';

export function calculatePureAlcohol(volumeMl: number, alcoholPercent: number): number {
  const pure = (volumeMl * alcoholPercent * 0.8) / 100;
  return Math.round(pure * 10) / 10;
}

export function getDrinkAlcohol(drinkId: DrinkPreset['id'], presets: DrinkPreset[]): number {
  const preset = presets.find((item) => item.id === drinkId);
  if (!preset) {
    return 0;
  }
  return calculatePureAlcohol(preset.volumeMl, preset.alcoholPercent);
}

export function calculateSessionAlcohol(entries: DrinkEntry[], presets: DrinkPreset[]): number {
  const total = entries.reduce((sum, entry) => sum + getDrinkAlcohol(entry.drinkId, presets), 0);
  return Math.round(total * 10) / 10;
}
