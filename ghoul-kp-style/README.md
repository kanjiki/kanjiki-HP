# GHOUL KP STYLE TEST

Google Apps Script で公開していた GHOUL KP STYLE TEST の GitHub Pages 版フロントエンドです。

## 構成

- `index.html` — 診断本体。GitHub Pages で配信します。
- `apps-script/Code.gs` — 既存の回答集計ロジック + GitHub Pages からの POST 受信 (`doPost`)。
- `apps-script/appsscript.json` — Apps Script manifest。

## データ保存

回答は既存の Google Apps Script Web App へ `POST` し、既存の `GHOUL KP STYLE TEST 回答集計` スプレッドシートへ保存します。

API endpoint: `https://script.google.com/macros/s/AKfycbzdIcT7AkIuF1qyQTAEcIqgrFuiwJZdcsiZY7TPo9KKNziWKR1R1DYkUyTAkRdqZQXaeA/exec`

GitHub Pages は別オリジンなので、フロントエンドは `text/plain` + `mode: no-cors` で JSON を送信します。Apps Script 側の `doPost()` が JSON を読み、既存の `submitResult()` を呼びます。

## Apps Script 側で必要な操作

1. `Code.gs` を Apps Script プロジェクトへ反映する。
2. **デプロイ > デプロイを管理 > 編集 > 新しいバージョン** で既存 Web App を再デプロイする。
3. `/exec` URL はそのまま利用する。

既存のスプレッドシートと回答データは変更しません。
