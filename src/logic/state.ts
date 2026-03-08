import type { StateLabel } from '../types/models';

export function getStateLabel(totalAlcoholG: number, thresholds: number[]): StateLabel {
  const [safe, light, tipsy, warning] = thresholds;
  if (totalAlcoholG <= safe) {
    return 'しらふ寄り';
  }
  if (totalAlcoholG <= light) {
    return '軽く回ってきた';
  }
  if (totalAlcoholG <= tipsy) {
    return 'ほろ酔い';
  }
  if (totalAlcoholG <= warning) {
    return '飲み過ぎ注意';
  }
  return 'かなり飲み過ぎ';
}
