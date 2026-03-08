import { beforeEach, describe, expect, it } from 'vitest';

import { clearCurrentSession, loadCurrentSession, loadHistory, loadSettings, saveCurrentSession, saveHistory, saveSettings } from './localStorage';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('localStorage module', () => {
  beforeEach(() => {
    // @ts-expect-error test override
    global.localStorage = new LocalStorageMock();
  });

  it('settingsを保存・読込できる', () => {
    const settings = loadSettings();
    settings.defaultTargetAmountG = 50;
    saveSettings(settings);
    expect(loadSettings().defaultTargetAmountG).toBe(50);
  });

  it('currentSessionを保存・削除できる', () => {
    saveCurrentSession({
      id: 's1',
      startedAt: Date.now(),
      targetAmountG: 60,
      tomorrowPlan: 'normal',
      entries: []
    });
    expect(loadCurrentSession()?.id).toBe('s1');
    clearCurrentSession();
    expect(loadCurrentSession()).toBeNull();
  });

  it('historyを保存・読込できる', () => {
    saveHistory([
      {
        id: 'h1',
        startedAt: Date.now(),
        endedAt: Date.now(),
        targetAmountG: 60,
        totalAlcoholG: 20,
        finalState: '軽く回ってきた',
        entries: []
      }
    ]);
    expect(loadHistory()).toHaveLength(1);
  });
});
