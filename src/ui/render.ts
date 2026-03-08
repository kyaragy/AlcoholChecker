import { calculateSessionAlcohol, getDrinkAlcohol } from '../logic/alcohol';
import { detectChaserRecommendation } from '../logic/chaser';
import { detectPaceWarning } from '../logic/pace';
import { getStateLabel } from '../logic/state';
import type {
  AppSettings,
  CurrentSession,
  DrinkId,
  SessionHistoryItem,
  SessionView,
  StateLabel
} from '../types/models';

export interface RenderState {
  view: SessionView;
  settings: AppSettings;
  currentSession: CurrentSession | null;
  history: SessionHistoryItem[];
  pendingReviewSessionId: string | null;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ja-JP');
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function badgeClass(label: StateLabel): string {
  if (label === 'かなり飲み過ぎ' || label === '飲み過ぎ注意') {
    return 'badge danger';
  }
  if (label === 'ほろ酔い') {
    return 'badge warn';
  }
  return 'badge safe';
}

function renderSetup(state: RenderState): string {
  const settings = state.settings;
  return `
    <section class="card">
      <h2>開始前設定</h2>
      <form id="setup-form" class="form-grid">
        <label>今日の目安量</label>
        <div class="choices">
          <label class="radio-option"><span>軽め (40g)</span><input type="radio" name="target" value="40"></label>
          <label class="radio-option"><span>普通 (60g)</span><input type="radio" name="target" value="60" checked></label>
          <label class="radio-option"><span>多め (80g)</span><input type="radio" name="target" value="80"></label>
          <label>手入力 <input name="customTarget" type="number" min="10" max="150" placeholder="${settings.defaultTargetAmountG}"></label>
        </div>
        <label>明日の予定</label>
        <div class="choices">
          <label class="radio-option"><span>重要</span><input type="radio" name="tomorrowPlan" value="important" checked></label>
          <label class="radio-option"><span>普通</span><input type="radio" name="tomorrowPlan" value="normal"></label>
          <label class="radio-option"><span>休み</span><input type="radio" name="tomorrowPlan" value="holiday"></label>
        </div>
        <button class="primary" type="submit">飲み会を開始する</button>
      </form>
    </section>
  `;
}

function renderMain(state: RenderState): string {
  const session = state.currentSession;
  if (!session) {
    return '<section class="card"><p>セッションがありません。開始前設定から始めてください。</p></section>';
  }

  const total = calculateSessionAlcohol(session.entries, state.settings.drinkPresets);
  const label = getStateLabel(total, state.settings.stateThresholds);
  const pace = detectPaceWarning(
    session.entries,
    state.settings.drinkPresets,
    state.settings.paceThresholdShortMinutes,
    state.settings.paceThresholdLongMinutes
  );
  const chaser = detectChaserRecommendation(session.entries, state.settings.drinkPresets, label);
  const recent = session.entries.slice(-5).reverse();

  return `
    <section class="card">
      <div class="top-row">
        <button class="ghost" data-nav="settings">設定</button>
      </div>
      <h2>飲酒中メイン</h2>
      <p class="label-title">今の状態</p>
      <p class="${badgeClass(label)}">${label}</p>
      <p class="summary">累計 ${total}g / 目安 ${session.targetAmountG}g</p>
      <p class="next-action">${chaser.message}</p>
      <p class="pace ${pace.level !== 'none' ? 'alert' : ''}">${pace.message || 'ペース警告なし'}</p>

      <div class="drink-grid">
        ${state.settings.drinkPresets
          .map(
            (preset) => `
            <button class="drink ${preset.id === 'water' ? 'water' : ''}" data-add-drink="${preset.id}">
              ${preset.name}<br><small>${getDrinkAlcohol(preset.id, state.settings.drinkPresets)}g</small>
            </button>
          `
          )
          .join('')}
      </div>

      <h3>直近履歴</h3>
      <ul class="history-list">
        ${
          recent.length
            ? recent.map((entry) => {
                const preset = state.settings.drinkPresets.find((item) => item.id === entry.drinkId);
                return `<li>${formatTime(entry.timestamp)} ${preset?.name ?? entry.drinkId}</li>`;
              }).join('')
            : '<li>まだ記録がありません</li>'
        }
      </ul>

      <div class="actions">
        <button data-action="undo">1件取り消し</button>
        <button data-nav="history">履歴を見る</button>
        <button data-action="finish">会を終了</button>
      </div>
    </section>
  `;
}

function renderReflection(state: RenderState): string {
  const pending = state.history.find((item) => item.id === state.pendingReviewSessionId);
  if (!pending) {
    return `
      <section class="card">
        <h2>翌朝振り返り</h2>
        <p>振り返り対象がありません。</p>
        <button data-nav="history">履歴へ</button>
      </section>
    `;
  }

  return `
    <section class="card">
      <h2>翌朝振り返り</h2>
      <p>${formatDate(pending.startedAt)} / 累計 ${pending.totalAlcoholG}g / 最終状態 ${pending.finalState}</p>
      <form id="review-form" class="form-grid">
        <label>二日酔い度合い (1-5)<input name="hangover" type="number" min="1" max="5" required></label>
        <label>眠気 (1-5)<input name="sleepiness" type="number" min="1" max="5" required></label>
        <label>後悔度 (1-5)<input name="regret" type="number" min="1" max="5" required></label>
        <label>メモ<textarea name="memo" rows="3" placeholder="次回に活かすメモ"></textarea></label>
        <button class="primary" type="submit">保存</button>
        <button type="button" class="ghost" data-nav="history">履歴一覧へ戻る</button>
      </form>
    </section>
  `;
}

function renderHistory(state: RenderState): string {
  return `
    <section class="card">
      <h2>履歴一覧</h2>
      <ul class="history-list">
        ${
          state.history.length
            ? state.history
                .slice()
                .reverse()
                .map(
                  (item) =>
                    `<li>
                      ${formatDate(item.startedAt)} / ${item.totalAlcoholG}g / ${item.finalState} / 振り返り: ${item.review ? 'あり' : 'なし'}
                    </li>`
                )
                .join('')
            : '<li>履歴はまだありません</li>'
        }
      </ul>
      <div class="actions">
        <button data-nav="setup">開始前設定</button>
        <button data-nav="main">メイン画面</button>
        <button data-nav="reflection">翌朝振り返り</button>
      </div>
    </section>
  `;
}

function renderSettings(state: RenderState): string {
  const presets = state.settings.drinkPresets;
  return `
    <section class="card">
      <h2>設定</h2>
      <form id="settings-form" class="form-grid">
        <label>デフォルト目安量(g)
          <input name="defaultTargetAmountG" type="number" min="10" max="150" value="${state.settings.defaultTargetAmountG}">
        </label>
        <label>状態閾値 1 (しらふ寄り上限)
          <input name="th1" type="number" value="${state.settings.stateThresholds[0]}">
        </label>
        <label>状態閾値 2 (軽く回ってきた上限)
          <input name="th2" type="number" value="${state.settings.stateThresholds[1]}">
        </label>
        <label>状態閾値 3 (ほろ酔い上限)
          <input name="th3" type="number" value="${state.settings.stateThresholds[2]}">
        </label>
        <label>状態閾値 4 (飲み過ぎ注意上限)
          <input name="th4" type="number" value="${state.settings.stateThresholds[3]}">
        </label>
        <label>ペース警告 短時間(分)
          <input name="paceShort" type="number" value="${state.settings.paceThresholdShortMinutes}">
        </label>
        <label>ペース警告 長時間(分)
          <input name="paceLong" type="number" value="${state.settings.paceThresholdLongMinutes}">
        </label>
        ${presets
          .map(
            (preset) => `
              <label>${preset.name} 量(ml)
                <input name="${preset.id}_ml" type="number" value="${preset.volumeMl}">
              </label>
              <label>${preset.name} 度数(%)
                <input name="${preset.id}_abv" type="number" step="0.1" value="${preset.alcoholPercent}">
              </label>
            `
          )
          .join('')}
        <button class="primary" type="submit">設定を保存</button>
      </form>
      <button class="ghost" data-nav="main">戻る</button>
    </section>
  `;
}

export function renderApp(state: RenderState): string {
  const content =
    state.view === 'setup'
      ? renderSetup(state)
      : state.view === 'main'
        ? renderMain(state)
        : state.view === 'reflection'
          ? renderReflection(state)
          : state.view === 'history'
            ? renderHistory(state)
            : renderSettings(state);

  return `
    <main class="app-shell">
      <header>
        <h1>飲み過ぎ防止PWA</h1>
      </header>
      ${content}
    </main>
  `;
}

export function parseDrinkId(value: string | null): DrinkId | null {
  if (!value) {
    return null;
  }

  if (value === 'beerMedium' || value === 'beerLarge' || value === 'highballSour' || value === 'water') {
    return value;
  }

  return null;
}
