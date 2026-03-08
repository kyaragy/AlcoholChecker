import { DEFAULT_SETTINGS } from '../constants/presets';
import type { AppSettings, CurrentSession, SessionHistoryItem } from '../types/models';

const SETTINGS_KEY = 'alcoholChecker.settings';
const CURRENT_SESSION_KEY = 'alcoholChecker.currentSession';
const HISTORY_KEY = 'alcoholChecker.sessionsHistory';

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadSettings(): AppSettings {
  return safeParse<AppSettings>(localStorage.getItem(SETTINGS_KEY)) ?? DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadCurrentSession(): CurrentSession | null {
  return safeParse<CurrentSession>(localStorage.getItem(CURRENT_SESSION_KEY));
}

export function saveCurrentSession(session: CurrentSession): void {
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
}

export function clearCurrentSession(): void {
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

export function loadHistory(): SessionHistoryItem[] {
  return safeParse<SessionHistoryItem[]>(localStorage.getItem(HISTORY_KEY)) ?? [];
}

export function saveHistory(history: SessionHistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
