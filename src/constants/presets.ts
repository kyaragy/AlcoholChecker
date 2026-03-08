import type { AppSettings, DrinkPreset } from '../types/models';

export const DRINK_PRESETS: DrinkPreset[] = [
  { id: 'beerMedium', name: 'ビール中ジョッキ', volumeMl: 400, alcoholPercent: 5 },
  { id: 'beerLarge', name: 'ビール大ジョッキ', volumeMl: 700, alcoholPercent: 5 },
  { id: 'highballSour', name: 'ハイボール・サワー', volumeMl: 350, alcoholPercent: 7 },
  { id: 'water', name: '水', volumeMl: 250, alcoholPercent: 0 }
];

export const STATE_THRESHOLDS = [15, 30, 50, 65] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTargetAmountG: 60,
  drinkPresets: DRINK_PRESETS,
  stateThresholds: [...STATE_THRESHOLDS],
  paceThresholdShortMinutes: 15,
  paceThresholdLongMinutes: 30
};

export const TARGET_PRESETS = {
  light: 40,
  normal: 60,
  heavy: 80
} as const;
