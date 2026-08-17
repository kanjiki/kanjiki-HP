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

## v1.2 calibration

2026-08-17 時点の 128 回答（詳細 96 / クイック 32）の再解析をもとに、診断構造を調整しています。

- 厳格度を生得点ではなく `-100〜+100` の厳格度指数へ正規化し、詳細版とクイック版を比較可能にしました。
- 厳格度の識別力が弱い Q3 / Q8 / Q17 は厳格度への寄与を弱めています（Q8 は除外、Q3 / Q17 は 0.5 倍）。G/H/O/U/L の得点には影響しません。
- Q19、Q2、Q6、Q17、Q18、Q11 の「誰でも選びやすい理由」表現を、各軸の違いが出やすい文面へ修正しました。
- Q1 / Q5 / Q13 は自由記述で繰り返し現れた裁定を既存三択へ取り込みました。
- Q12 に「クリティカルチケット自体を採用していない」を採点対象外回答として追加しました。
- 新規回答には `厳格度指数`、`厳格度最大幅`、`診断バージョン`、`設問セットバージョン` を保存します。既存回答列は保持します。

G/H/O/U/L の軸そのものの重みは変更していません。H が多いという観測だけを理由に一律補正せず、まず設問の識別力を改善して再計測します。

## Apps Script 側で必要な操作

1. このリポジトリの `apps-script/Code.gs` の内容を、既存 Apps Script プロジェクトの `コード.gs` へ反映する。
2. **デプロイ > デプロイを管理 > 編集 > 新しいバージョン** で既存 Web App を再デプロイする。
3. `setupResultsSheet()` を一度実行し、回答シート末尾の v1.2 列と集計式を更新する。

既存のスプレッドシートと回答データは削除・上書きしません。
