export const ACTION_MESSAGES = {
  drinkStop: '今日はここで止めたい。水を飲んで休憩しよう。',
  strongWater: '酒が続いています。次は必ず水を1杯飲もう。',
  normalWater: '次は水を1杯飲もう。',
  balanced: 'いいペースです。この調子でゆっくり。'
} as const;

export const PACE_MESSAGES = {
  fast: '15分で2杯。少し早いです',
  veryFast: '30分で3杯。かなりハイペースです'
} as const;
