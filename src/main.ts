import './styles.css';

import { calculateSessionAlcohol } from './logic/alcohol';
import { getStateLabel } from './logic/state';
import {
  clearCurrentSession,
  loadCurrentSession,
  loadHistory,
  loadSettings,
  saveCurrentSession,
  saveHistory,
  saveSettings
} from './storage/localStorage';
import type { CurrentSession, SessionHistoryItem, SessionView } from './types/models';
import { parseDrinkId, renderApp, type RenderState } from './ui/render';

const appElement = document.querySelector<HTMLDivElement>('#app');
if (!appElement) {
  throw new Error('App root not found');
}
const app = appElement;

const state: RenderState = {
  view: loadCurrentSession() ? 'main' : 'setup',
  settings: loadSettings(),
  currentSession: loadCurrentSession(),
  history: loadHistory(),
  pendingReviewSessionId: null
};

function navigate(view: SessionView): void {
  if (!state.currentSession && view === 'main') {
    state.view = 'setup';
  } else {
    state.view = view;
  }
  render();
}

function render(): void {
  app.innerHTML = renderApp(state);
}

function startSession(form: HTMLFormElement): void {
  const formData = new FormData(form);
  const targetSelected = Number(formData.get('target') ?? '60');
  const customRaw = String(formData.get('customTarget') ?? '').trim();
  const customTarget = customRaw ? Number(customRaw) : NaN;
  const tomorrowPlan = (formData.get('tomorrowPlan') as CurrentSession['tomorrowPlan']) ?? 'normal';

  const targetAmountG = Number.isFinite(customTarget) && customTarget > 0 ? customTarget : targetSelected;

  state.currentSession = {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    targetAmountG,
    tomorrowPlan,
    entries: []
  };

  saveCurrentSession(state.currentSession);
  navigate('main');
}

function addDrink(drinkId: string): void {
  if (!state.currentSession) {
    return;
  }

  const parsed = parseDrinkId(drinkId);
  if (!parsed) {
    return;
  }

  state.currentSession.entries.push({
    id: crypto.randomUUID(),
    drinkId: parsed,
    timestamp: Date.now()
  });

  saveCurrentSession(state.currentSession);
  render();
}

function undoLatest(): void {
  if (!state.currentSession || state.currentSession.entries.length === 0) {
    return;
  }
  state.currentSession.entries.pop();
  saveCurrentSession(state.currentSession);
  render();
}

function finishSession(): void {
  if (!state.currentSession) {
    return;
  }

  const totalAlcoholG = calculateSessionAlcohol(state.currentSession.entries, state.settings.drinkPresets);
  const finalState = getStateLabel(totalAlcoholG, state.settings.stateThresholds);

  const item: SessionHistoryItem = {
    id: state.currentSession.id,
    startedAt: state.currentSession.startedAt,
    endedAt: Date.now(),
    targetAmountG: state.currentSession.targetAmountG,
    entries: state.currentSession.entries,
    totalAlcoholG,
    finalState
  };

  state.history.push(item);
  saveHistory(state.history);
  state.pendingReviewSessionId = item.id;
  state.currentSession = null;
  clearCurrentSession();
  navigate('reflection');
}

function saveReview(form: HTMLFormElement): void {
  if (!state.pendingReviewSessionId) {
    return;
  }

  const formData = new FormData(form);
  const historyItem = state.history.find((item) => item.id === state.pendingReviewSessionId);
  if (!historyItem) {
    return;
  }

  historyItem.review = {
    hangoverLevel: Number(formData.get('hangover') ?? 1),
    sleepinessLevel: Number(formData.get('sleepiness') ?? 1),
    regretLevel: Number(formData.get('regret') ?? 1),
    memo: String(formData.get('memo') ?? '')
  };

  saveHistory(state.history);
  state.pendingReviewSessionId = null;
  navigate('history');
}

function saveSettingsFromForm(form: HTMLFormElement): void {
  const formData = new FormData(form);

  const newPresets = state.settings.drinkPresets.map((preset) => ({
    ...preset,
    volumeMl: Number(formData.get(`${preset.id}_ml`) ?? preset.volumeMl),
    alcoholPercent: Number(formData.get(`${preset.id}_abv`) ?? preset.alcoholPercent)
  }));

  const thresholds = [
    Number(formData.get('th1') ?? state.settings.stateThresholds[0]),
    Number(formData.get('th2') ?? state.settings.stateThresholds[1]),
    Number(formData.get('th3') ?? state.settings.stateThresholds[2]),
    Number(formData.get('th4') ?? state.settings.stateThresholds[3])
  ].sort((a, b) => a - b);

  state.settings = {
    defaultTargetAmountG: Number(formData.get('defaultTargetAmountG') ?? state.settings.defaultTargetAmountG),
    drinkPresets: newPresets,
    stateThresholds: thresholds,
    paceThresholdShortMinutes: Number(
      formData.get('paceShort') ?? state.settings.paceThresholdShortMinutes
    ),
    paceThresholdLongMinutes: Number(formData.get('paceLong') ?? state.settings.paceThresholdLongMinutes)
  };

  saveSettings(state.settings);
  render();
}

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  const nav = target.closest<HTMLElement>('[data-nav]');
  if (nav) {
    const view = nav.dataset.nav as SessionView;
    navigate(view);
    return;
  }

  const add = target.closest<HTMLElement>('[data-add-drink]');
  if (add) {
    addDrink(add.dataset.addDrink ?? '');
    return;
  }

  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  if (action === 'undo') {
    undoLatest();
    return;
  }

  if (action === 'finish') {
    finishSession();
  }
});

app.addEventListener('submit', (event) => {
  const form = event.target as HTMLFormElement;
  event.preventDefault();

  if (form.id === 'setup-form') {
    startSession(form);
    return;
  }

  if (form.id === 'review-form') {
    saveReview(form);
    return;
  }

  if (form.id === 'settings-form') {
    saveSettingsFromForm(form);
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // ignore registration failures
    });
  });
}

render();
