# GHOUL KP STYLE TEST

Google Apps Script で公開していた GHOUL KP STYLE TEST の GitHub Pages 版フロントエンドです。

## 構成

- `index.html` — GitHub Pages 用エントリーポイント。
- `assets/` — スタイル、診断データ、採点・画面・共有ロジック。
- `apps-script/Code.gs` — 既存の回答集計ロジック + GitHub Pages からの POST 受信 (`doPost`)。
- `apps-script/appsscript.json` — Apps Script manifest。

## データ保存

回答は既存の Google Apps Script Web App へ `POST` し、既存の `GHOUL KP STYLE TEST 回答集計` スプレッドシートへ保存する構成です。

既存 Web App endpoint:
`https://script.google.com/macros/s/AKfycbzdIcT7AkIuF1qyQTAEcIqgrFuiwJZdcsiZY7TPo9KKNziWKR1R1DYkUyTAkRdqZQXaeA/exec`

GitHub Pages は別オリジンなので、フロントエンドは `text/plain` + `mode: no-cors` で JSON を送信します。Apps Script 側の `doPost()` が JSON を読み、既存の `submitResult()` を呼びます。

## 現在の移行状態

診断フロントエンドは GitHub Pages に移行済みです。ただし、既存 Apps Script に `doPost()` を反映して再デプロイするまでは、回答の自動送信を安全のため一時停止しています。`assets/script-0.js` の `GHOUL_PENDING_API_URL` に既存 endpoint を保持しています。

## Apps Script 側で必要な操作

1. このリポジトリの `apps-script/Code.gs` の内容を、既存 Apps Script プロジェクトの `コード.gs` へ反映する。
2. **デプロイ > デプロイを管理 > 編集 > 新しいバージョン** で既存 Web App を再デプロイする。
3. 再デプロイ後、`assets/script-0.js` の `GHOUL_API_URL` を既存 endpoint に設定する。

既存のスプレッドシートと回答データは変更しません。
