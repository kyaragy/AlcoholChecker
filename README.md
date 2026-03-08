# 飲み過ぎ防止PWA

飲み会中に酒と水をワンタップで記録し、累計純アルコール量・状態ラベル・ペース警告・チェイサー推奨を表示する個人向けPWAです。データは端末の `localStorage` のみに保存します。

## ローカル起動手順
1. `npm install`
2. `npm run dev`
3. 表示されたURLを開く

## ビルド手順
1. `npm run build`
2. 生成物は `dist/`

## テスト手順
1. `npm run test`

## GitHub Pages 公開手順
1. `npm run build`
2. `dist/` を Pages 公開対象にする（`gh-pages` ブランチ or Actions）
3. リポジトリの Pages 設定で公開先を有効化

## PWAとしてホーム画面追加する手順
1. Android Chrome で公開URLへアクセス
2. Chromeメニューから「ホーム画面に追加」を選択
3. 追加後はアプリ表示（standalone）で起動

## 主要ファイル構成と役割
- `index.html`: エントリHTML
- `public/manifest.webmanifest`: PWAマニフェスト
- `public/sw.js`: service worker（オフラインキャッシュ）
- `src/main.ts`: アプリ状態管理とイベント処理
- `src/constants/presets.ts`: 飲み物プリセット・閾値の定数
- `src/logic/*.ts`: 計算・判定ロジック
- `src/storage/localStorage.ts`: 永続化処理
- `src/ui/render.ts`: 5画面の描画
- `src/**/*.test.ts`: 単体テスト
- `docs/requirements.md`: 要件定義
- `docs/screen-spec.md`: 画面仕様
