export type DrinkId = 'beerMedium' | 'beerLarge' | 'highballSour' | 'water';

export type SessionView = 'setup' | 'main' | 'reflection' | 'history' | 'settings';

export type StateLabel =
  | 'しらふ寄り'
  | '軽く回ってきた'
  | 'ほろ酔い'
  | '飲み過ぎ注意'
  | 'かなり飲み過ぎ';

export interface DrinkPreset {
  id: DrinkId;
  name: string;
  volumeMl: number;
  alcoholPercent: number;
}

export interface DrinkEntry {
  id: string;
  drinkId: DrinkId;
  timestamp: number;
}

export interface AppSettings {
  defaultTargetAmountG: number;
  drinkPresets: DrinkPreset[];
  stateThresholds: number[];
  paceThresholdShortMinutes: number;
  paceThresholdLongMinutes: number;
}

export interface CurrentSession {
  id: string;
  startedAt: number;
  targetAmountG: number;
  tomorrowPlan: 'important' | 'normal' | 'holiday';
  entries: DrinkEntry[];
}

export interface MorningReview {
  hangoverLevel: number;
  sleepinessLevel: number;
  regretLevel: number;
  memo: string;
}

export interface SessionHistoryItem {
  id: string;
  startedAt: number;
  endedAt: number;
  targetAmountG: number;
  totalAlcoholG: number;
  finalState: StateLabel;
  entries: DrinkEntry[];
  review?: MorningReview;
}
