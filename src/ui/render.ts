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

function stateTone(label: StateLabel): string {
  if (label === 'しらふ寄り') {
    return 'tone-sober';
  }
  if (label === '軽く回ってきた') {
    return 'tone-light';
  }
  if (label === 'ほろ酔い') {
    return 'tone-tipsy';
  }
  if (label === '飲み過ぎ注意') {
    return 'tone-warning';
  }
  return 'tone-danger';
}

function navButton(label: string, view: SessionView, activeView: SessionView): string {
  const activeClass = activeView === view ? 'is-active' : '';
  return `<button class="tab-chip ${activeClass}" data-nav="${view}">${label}</button>`;
}

function renderSetup(state: RenderState): string {
  return `
    <section class="glass-card stack-lg">
      <div>
        <p class="eyebrow">Session Setup</p>
        <h2>開始前設定</h2>
      </div>

      <form id="setup-form" class="stack-md">
        <div class="stack-sm">
          <p class="field-label">今日の目安量</p>
          <div class="choice-grid">
            <label class="choice-pill"><input type="radio" name="target" value="40"><span class="choice-pill-ui">軽め 40g</span></label>
            <label class="choice-pill"><input type="radio" name="target" value="60" checked><span class="choice-pill-ui">普通 60g</span></label>
            <label class="choice-pill"><input type="radio" name="target" value="80"><span class="choice-pill-ui">多め 80g</span></label>
          </div>
          <label class="input-wrap">
            <span>手入力</span>
            <input name="customTarget" type="number" min="10" max="150" placeholder="${state.settings.defaultTargetAmountG}">
          </label>
        </div>

        <div class="stack-sm">
          <p class="field-label">明日の予定</p>
          <div class="choice-grid choice-grid-3">
            <label class="choice-pill"><input type="radio" name="tomorrowPlan" value="important" checked><span class="choice-pill-ui">重要</span></label>
            <label class="choice-pill"><input type="radio" name="tomorrowPlan" value="normal"><span class="choice-pill-ui">普通</span></label>
            <label class="choice-pill"><input type="radio" name="tomorrowPlan" value="holiday"><span class="choice-pill-ui">休み</span></label>
          </div>
        </div>

        <button class="cta" type="submit">飲み会を開始する</button>
      </form>
    </section>
  `;
}

function renderMain(state: RenderState): string {
  const session = state.currentSession;
  if (!session) {
    return `
      <section class="glass-card stack-md">
        <h2>セッション未開始</h2>
        <p>開始前設定から飲み会を開始してください。</p>
        ${navButton('開始前設定へ', 'setup', state.view)}
      </section>
    `;
  }

  const total = calculateSessionAlcohol(session.entries, state.settings.drinkPresets);
  const label = getStateLabel(total, state.settings.stateThresholds);
  const tone = stateTone(label);
  const pace = detectPaceWarning(
    session.entries,
    state.settings.drinkPresets,
    state.settings.paceThresholdShortMinutes,
    state.settings.paceThresholdLongMinutes
  );
  const chaser = detectChaserRecommendation(session.entries, state.settings.drinkPresets, label);
  const recent = session.entries.slice(-3).reverse();

  const ratio = Math.min(100, Math.round((total / Math.max(1, session.targetAmountG)) * 100));

  return `
    <section class="state-card ${tone} stack-md">
      <div class="card-top">
        <p class="eyebrow">Live Session</p>
        <button class="text-link" data-nav="settings">設定</button>
      </div>

      <div class="stack-xs">
        <p class="state-label">${label}</p>
        <p class="state-amount">${total}g <span>/ 目安 ${session.targetAmountG}g</span></p>
      </div>

      <div class="meter">
        <div class="meter-fill" style="width:${ratio}%"></div>
      </div>

      <p class="action-message">${chaser.message}</p>
      <p class="pace-line ${pace.level !== 'none' ? 'hot' : ''}">${pace.message || 'ペースは安定しています'}</p>
    </section>

    <section class="glass-card stack-md">
      <h3>ドリンク登録</h3>
      <div class="drink-grid">
        ${state.settings.drinkPresets
          .map((preset) => {
            const icon =
              preset.id === 'beerMedium' || preset.id === 'beerLarge'
                ? '🍺'
                : preset.id === 'highballSour'
                  ? '🥃'
                  : '💧';

            return `
              <button class="drink-btn ${preset.id === 'water' ? 'water' : ''}" data-add-drink="${preset.id}">
                <strong>${icon} ${preset.name}</strong>
                <small>${getDrinkAlcohol(preset.id, state.settings.drinkPresets)}g</small>
              </button>
            `;
          })
          .join('')}
      </div>
    </section>

    <section class="glass-card stack-sm">
      <h3>直近履歴</h3>
      <ul class="timeline">
        ${
          recent.length
            ? recent
                .map((entry) => {
                  const preset = state.settings.drinkPresets.find((item) => item.id === entry.drinkId);
                  return `<li><time>${formatTime(entry.timestamp)}</time><span>${preset?.name ?? entry.drinkId}</span></li>`;
                })
                .join('')
            : '<li><span>まだ記録がありません</span></li>'
        }
      </ul>
    </section>

    <section class="control-row">
      <button class="control-btn" data-action="undo">1件取り消し</button>
      <button class="control-btn" data-nav="history">履歴を見る</button>
      <button class="control-btn danger" data-action="finish">会を終了</button>
    </section>
  `;
}

function renderReflection(state: RenderState): string {
  const pending = state.history.find((item) => item.id === state.pendingReviewSessionId);
  if (!pending) {
    return `
      <section class="glass-card stack-md">
        <h2>翌朝振り返り</h2>
        <p>振り返り対象がありません。</p>
        <button class="control-btn" data-nav="history">履歴へ</button>
      </section>
    `;
  }

  return `
    <section class="glass-card stack-md">
      <div>
        <p class="eyebrow">Morning Review</p>
        <h2>翌朝振り返り</h2>
        <p class="meta">${formatDate(pending.startedAt)} / 累計 ${pending.totalAlcoholG}g / ${pending.finalState}</p>
      </div>

      <form id="review-form" class="stack-sm">
        <label class="input-wrap"><span>二日酔い度合い (1-5)</span><input name="hangover" type="number" min="1" max="5" required></label>
        <label class="input-wrap"><span>眠気 (1-5)</span><input name="sleepiness" type="number" min="1" max="5" required></label>
        <label class="input-wrap"><span>後悔度 (1-5)</span><input name="regret" type="number" min="1" max="5" required></label>
        <label class="input-wrap"><span>メモ</span><textarea name="memo" rows="3" placeholder="次回に活かすメモ"></textarea></label>

        <div class="dual-row">
          <button class="cta" type="submit">保存</button>
          <button class="control-btn" type="button" data-nav="history">履歴一覧へ戻る</button>
        </div>
      </form>
    </section>
  `;
}

function renderHistory(state: RenderState): string {
  return `
    <section class="glass-card stack-md">
      <div>
        <p class="eyebrow">History</p>
        <h2>履歴一覧</h2>
      </div>

      <ul class="session-list">
        ${
          state.history.length
            ? state.history
                .slice()
                .reverse()
                .map(
                  (item) => `
                    <li class="session-item">
                      <div>
                        <p>${formatDate(item.startedAt)}</p>
                        <small>${item.totalAlcoholG}g / ${item.finalState}</small>
                      </div>
                      <span class="review-pill ${item.review ? 'done' : ''}">${item.review ? '振り返り済み' : '未記入'}</span>
                    </li>
                  `
                )
                .join('')
            : '<li class="session-item"><p>履歴はまだありません</p></li>'
        }
      </ul>

      <div class="dual-row">
        <button class="control-btn" data-nav="main">メイン画面</button>
        <button class="control-btn" data-nav="reflection">翌朝振り返り</button>
      </div>
    </section>
  `;
}

function renderSettings(state: RenderState): string {
  const presets = state.settings.drinkPresets;
  return `
    <section class="glass-card stack-md">
      <div>
        <p class="eyebrow">Settings</p>
        <h2>設定</h2>
      </div>

      <form id="settings-form" class="stack-sm">
        <label class="input-wrap"><span>デフォルト目安量(g)</span><input name="defaultTargetAmountG" type="number" min="10" max="150" value="${state.settings.defaultTargetAmountG}"></label>

        <div class="settings-grid">
          <label class="input-wrap"><span>状態閾値1</span><input name="th1" type="number" value="${state.settings.stateThresholds[0]}"></label>
          <label class="input-wrap"><span>状態閾値2</span><input name="th2" type="number" value="${state.settings.stateThresholds[1]}"></label>
          <label class="input-wrap"><span>状態閾値3</span><input name="th3" type="number" value="${state.settings.stateThresholds[2]}"></label>
          <label class="input-wrap"><span>状態閾値4</span><input name="th4" type="number" value="${state.settings.stateThresholds[3]}"></label>
        </div>

        <div class="settings-grid">
          <label class="input-wrap"><span>ペース警告 短時間(分)</span><input name="paceShort" type="number" value="${state.settings.paceThresholdShortMinutes}"></label>
          <label class="input-wrap"><span>ペース警告 長時間(分)</span><input name="paceLong" type="number" value="${state.settings.paceThresholdLongMinutes}"></label>
        </div>

        ${presets
          .map(
            (preset) => `
              <div class="settings-grid">
                <label class="input-wrap"><span>${preset.name} 量(ml)</span><input name="${preset.id}_ml" type="number" value="${preset.volumeMl}"></label>
                <label class="input-wrap"><span>${preset.name} 度数(%)</span><input name="${preset.id}_abv" type="number" step="0.1" value="${preset.alcoholPercent}"></label>
              </div>
            `
          )
          .join('')}

        <div class="dual-row">
          <button class="cta" type="submit">設定を保存</button>
          <button class="control-btn" type="button" data-nav="main">戻る</button>
        </div>
      </form>
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
      <header class="app-head">
        <div>
          <h1>飲み過ぎ防止PWA</h1>
          <p>飲み会中の安全ペースをサポート</p>
        </div>
      </header>

      <nav class="tab-bar">
        ${navButton('開始前', 'setup', state.view)}
        ${navButton('メイン', 'main', state.view)}
        ${navButton('履歴', 'history', state.view)}
      </nav>

      <section class="view-stack">
        ${content}
      </section>
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
