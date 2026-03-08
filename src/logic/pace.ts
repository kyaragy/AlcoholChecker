import type { DrinkEntry, DrinkPreset } from '../types/models';

export interface PaceWarning {
  level: 'none' | 'fast' | 'veryFast';
  message: string;
}

function isAlcoholDrink(drinkId: DrinkPreset['id'], presets: DrinkPreset[]): boolean {
  const preset = presets.find((item) => item.id === drinkId);
  return Boolean(preset && preset.alcoholPercent > 0);
}

export function detectPaceWarning(
  entries: DrinkEntry[],
  presets: DrinkPreset[],
  shortMinutes: number,
  longMinutes: number,
  now: number = Date.now()
): PaceWarning {
  const alcoholEntries = entries.filter((entry) => isAlcoholDrink(entry.drinkId, presets));

  const withinShort = alcoholEntries.filter(
    (entry) => now - entry.timestamp <= shortMinutes * 60 * 1000
  ).length;

  const withinLong = alcoholEntries.filter(
    (entry) => now - entry.timestamp <= longMinutes * 60 * 1000
  ).length;

  if (withinLong >= 3) {
    return { level: 'veryFast', message: '30分で3杯。かなりハイペースです' };
  }

  if (withinShort >= 2) {
    return { level: 'fast', message: '15分で2杯。少し早いです' };
  }

  return { level: 'none', message: '' };
}
