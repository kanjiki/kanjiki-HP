const RESULTS_PROPERTY = 'GHOUL_RESULTS_SHEET_ID';
const ANSWER_HEADERS = ['受信日時','回答日時','回答者名','モード','タイプ','タイプ名','G','H','O','U','L','厳格度','厳格度区分','有効回答数','独自裁定数','回答JSON','設問ID','厳格度指数','厳格度最大幅','診断バージョン','設問セットバージョン'];
const DETAIL_HEADERS = ['受信日時','回答者名','モード','タイプ','設問ID','回答順','裁定','理由','自由記述'];

function doGet() {
  const template = HtmlService.createTemplateFromFile('index');
  template.appUrl = ScriptApp.getService().getUrl() || '';
  return template.evaluate().setTitle('GHOUL KP STYLE TEST v1.2')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/** GitHub Pages など外部フロントエンドから回答を受け取ります。
 *  CORS preflight を避けるため、フロント側は text/plain で JSON 文字列を送信します。
 */
function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : '';
    const payload = raw ? JSON.parse(raw) : {};
    const result = submitResult(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(error)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** 初回設定と、既存ブックのv1.2形式への更新を行います。 */
function setupResultsSheet() {
  const properties = PropertiesService.getScriptProperties();
  const existing = properties.getProperty(RESULTS_PROPERTY);
  const book = existing ? SpreadsheetApp.openById(existing) : SpreadsheetApp.create('GHOUL KP STYLE TEST 回答集計 v1.2');
  if (!existing) properties.setProperty(RESULTS_PROPERTY, book.getId());
  prepareWorkbook_(book);
  console.log('回答集計シート: ' + book.getUrl());
  return book.getUrl();
}

function getResultsSheetUrl() {
  const id = PropertiesService.getScriptProperties().getProperty(RESULTS_PROPERTY);
  return id ? SpreadsheetApp.openById(id).getUrl() : '';
}

function submitResult(payload) {
  const id = PropertiesService.getScriptProperties().getProperty(RESULTS_PROPERTY);
  if (!id) throw new Error('回答集計シートが未設定です。setupResultsSheetを一度実行してください。');
  const p = payload || {}, scores = p.scores || {};
  const safeAnswers = sanitizeAnswers_(p.answers);
  const safeQuestionIds = Array.isArray(p.questionIds) ? p.questionIds.slice(0, 30).map(value => Number(value)).filter(Number.isFinite) : [];
  const rawStrictness = Number.isFinite(Number(p.strictnessRaw)) ? Number(p.strictnessRaw) : Number(p.strictness || 0);
  const strictnessIndex = Number.isFinite(Number(p.strictnessIndex)) ? Number(p.strictnessIndex) : Number(p.strictness || 0);
  const row = [new Date(), safeCell_(p.submittedAt, 40), safeCell_(p.participantName, 30), safeCell_(p.mode, 20),
    safeCell_(p.code, 8), safeCell_(p.name, 80), Number(scores.G || 0), Number(scores.H || 0),
    Number(scores.O || 0), Number(scores.U || 0), Number(scores.L || 0), rawStrictness,
    safeCell_(p.stance, 40), Number(p.validAnswers || 0), Number(p.customAnswers || 0),
    safeCell_(JSON.stringify(safeAnswers), 45000), safeCell_(JSON.stringify(safeQuestionIds), 1000),
    strictnessIndex, Number(p.strictnessMax || 0), safeCell_(p.testVersion || '', 20), safeCell_(p.questionSetVersion || '', 40)];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.openById(id);
    prepareAnswersSheet_(book);
    prepareDetailsSheet_(book);
    book.getSheetByName('回答').appendRow(row);
    appendAnswerDetails_(book, row[0], p, safeAnswers, safeQuestionIds);
  } finally { lock.releaseLock(); }
  return {ok:true};
}

function prepareWorkbook_(book) {
  prepareAnswersSheet_(book);
  prepareDetailsSheet_(book);
  prepareSummarySheet_(book);
}

function prepareDetailsSheet_(book) {
  const sheet = book.getSheetByName('回答詳細') || book.insertSheet('回答詳細');
  sheet.getRange(1,1,1,DETAIL_HEADERS.length).setValues([DETAIL_HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,DETAIL_HEADERS.length).setBackground('#173f35').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(1,1,Math.max(sheet.getLastRow(),2),DETAIL_HEADERS.length).createFilter();
  sheet.setColumnWidth(1,145); sheet.setColumnWidth(2,130); sheet.setColumnWidths(3,4,90);
  sheet.setColumnWidth(7,150); sheet.setColumnWidth(8,150); sheet.setColumnWidth(9,360);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2,1,sheet.getLastRow()-1,1).setNumberFormat('yyyy/mm/dd hh:mm:ss');
    sheet.getRange(2,1,sheet.getLastRow()-1,DETAIL_HEADERS.length).setVerticalAlignment('top');
    sheet.getRange(2,9,sheet.getLastRow()-1,1).setWrap(true);
  }
}

function appendAnswerDetails_(book, receivedAt, payload, answers, questionIds) {
  const rows = answers.map((answer,index) => {
    const a = answer || {};
    return [receivedAt, safeCell_(payload.participantName,30), safeCell_(payload.mode,20), safeCell_(payload.code,8),
      Number(questionIds[index] || 0), index + 1, safeCell_(a.ruling,40), safeCell_(a.reason,40), safeFreeText_(a.customText,240)];
  });
  if (!rows.length) return;
  const sheet = book.getSheetByName('回答詳細');
  sheet.getRange(sheet.getLastRow()+1,1,rows.length,DETAIL_HEADERS.length).setValues(rows);
}

/** 既存の「回答JSON」から回答詳細シートを再構築します。必要なときに手動実行してください。 */
function rebuildAnswerDetails() {
  const id = PropertiesService.getScriptProperties().getProperty(RESULTS_PROPERTY);
  if (!id) throw new Error('回答集計シートが未設定です。');
  const book = SpreadsheetApp.openById(id), source = book.getSheetByName('回答');
  if (!source || source.getLastRow() < 2) return 0;
  let detail = book.getSheetByName('回答詳細') || book.insertSheet('回答詳細');
  detail.clear(); prepareDetailsSheet_(book);
  const values = source.getRange(2,1,source.getLastRow()-1,ANSWER_HEADERS.length).getValues(), rows=[];
  values.forEach(row => {
    let answers=[], ids=[];
    try { answers=sanitizeAnswers_(JSON.parse(String(row[15]||'[]'))); } catch (_) {}
    try { ids=JSON.parse(String(row[16]||'[]')).map(Number); } catch (_) {}
    answers.forEach((answer,index) => { const a=answer||{}; rows.push([row[0],safeCell_(row[2],30),safeCell_(row[3],20),safeCell_(row[4],8),Number(ids[index]||0),index+1,safeCell_(a.ruling,40),safeCell_(a.reason,40),safeFreeText_(a.customText,240)]); });
  });
  if (rows.length) detail.getRange(2,1,rows.length,DETAIL_HEADERS.length).setValues(rows);
  prepareDetailsSheet_(book);
  return rows.length;
}

function prepareAnswersSheet_(book) {
  let sheet = book.getSheetByName('回答') || book.getSheets()[0];
  if (sheet.getName() !== '回答') sheet.setName('回答');
  const currentHeaders = sheet.getLastColumn() ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];
  if (currentHeaders.length && !currentHeaders.includes('回答者名') && sheet.getLastRow() > 0) sheet.insertColumnAfter(2);
  sheet.getRange(1,1,1,ANSWER_HEADERS.length).setValues([ANSWER_HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,ANSWER_HEADERS.length).setBackground('#173f35').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  if (sheet.getFilter()) sheet.getFilter().remove();
  const filterRows = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(1,1,filterRows,ANSWER_HEADERS.length).createFilter();
  sheet.setColumnWidth(1,145); sheet.setColumnWidth(2,145); sheet.setColumnWidth(3,130);
  sheet.setColumnWidths(4,3,105); sheet.setColumnWidths(7,5,58); sheet.setColumnWidths(12,4,105);
  sheet.setColumnWidth(16,320); sheet.setColumnWidth(17,210); sheet.setColumnWidths(18,2,105); sheet.setColumnWidths(20,2,130);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2,1,sheet.getLastRow()-1,1).setNumberFormat('yyyy/mm/dd hh:mm:ss');
    sheet.getRange(2,7,sheet.getLastRow()-1,6).setNumberFormat('0.0');
    sheet.getRange(2,18,sheet.getLastRow()-1,2).setNumberFormat('0.0');
    sheet.getRange(2,1,sheet.getLastRow()-1,ANSWER_HEADERS.length).setVerticalAlignment('middle');
  }
}

function prepareSummarySheet_(book) {
  let summary = book.getSheetByName('集計') || book.insertSheet('集計');
  summary.clear(); summary.getCharts().forEach(chart => summary.removeChart(chart));
  summary.getRange('A1:B1').setValues([['集計項目','値']]);
  summary.getRange('A2:A9').setValues([['回答数'],['平均G'],['平均H'],['平均O'],['平均U'],['平均L'],['平均厳格度指数'],['独自裁定率']]);
  summary.getRange('B2').setFormula("=COUNTA('回答'!A2:A)");
  ['G','H','I','J','K'].forEach((column,index) => summary.getRange(3+index,2).setFormula(`=IFERROR(AVERAGE('回答'!${column}2:${column}),0)`));
  summary.getRange('B8').setFormula("=IFERROR(AVERAGE(ARRAYFORMULA(IF('回答'!A2:A=\"\",,IF('回答'!R2:R<>\"\",'回答'!R2:R,IF('回答'!N2:N>0,'回答'!L2:L/'回答'!N2:N*100,0))))),0)");
  summary.getRange('B9').setFormula("=IFERROR(SUM('回答'!O2:O)/(SUM('回答'!N2:N)+SUM('回答'!O2:O)),0)").setNumberFormat('0.0%');
  summary.getRange('D1:E1').setValues([['タイプ','回答数']]);
  const types = ['GH','GO','GU','GL','HG','HO','HU','HL','OG','OH','OU','OL','UG','UH','UO','UL','LG','LH','LO','LU'];
  summary.getRange(2,4,types.length,1).setValues(types.map(type=>[type]));
  types.forEach((_,index)=>summary.getRange(2+index,5).setFormula(`=COUNTIF('回答'!E:E,D${2+index})`));
  summary.getRange('G1:H1').setValues([['回答者名','回答回数']]);
  summary.getRange('G2').setFormula("=QUERY('回答'!C2:C,\"select C,count(C) where C is not null group by C label C '',count(C) ''\",0)");
  summary.getRangeList(['A1:B1','D1:E1','G1:H1']).setBackground('#173f35').setFontColor('#ffffff').setFontWeight('bold');
  summary.setFrozenRows(1); summary.setColumnWidths(1,8,120); summary.setColumnWidth(1,150); summary.setColumnWidth(7,160);
  summary.getRange('A2:B9').applyRowBanding(SpreadsheetApp.BandingTheme.GREEN);
  summary.getRange('D2:E21').applyRowBanding(SpreadsheetApp.BandingTheme.GREEN);
  const averageChart = summary.newChart().asColumnChart().addRange(summary.getRange('A3:B7')).setPosition(2,10,0,0)
    .setOption('title','GHOUL 5軸の平均').setOption('legend',{position:'none'}).setOption('colors',['#b4773c']).build();
  const typeChart = summary.newChart().asBarChart().addRange(summary.getRange('D1:E21')).setPosition(18,10,0,0)
    .setOption('title','タイプ別の回答数').setOption('legend',{position:'none'}).setOption('colors',['#2d6a58']).build();
  summary.insertChart(averageChart); summary.insertChart(typeChart);
}

function clean_(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0,maxLength);
}

/** Sheetsの数式として解釈される先頭文字を無効化します。 */
function safeCell_(value, maxLength) {
  const text = clean_(value, maxLength);
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}

/** 自由記述からリンク・実行可能スキームを除去し、既知の回答項目だけを保存します。 */
function safeFreeText_(value, maxLength) {
  return safeCell_(value, maxLength).replace(
    /(?:https?:\/\/|www\.|javascript\s*:|data\s*:|vbscript\s*:|file\s*:)[^\s<>"']*/gi,
    '[URLを除去]'
  );
}

function sanitizeAnswers_(answers) {
  if (!Array.isArray(answers)) return [];
  return answers.slice(0, 30).map(answer => {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null;
    const safe = {};
    if ('ruling' in answer) safe.ruling = safeFreeText_(answer.ruling, 40);
    if ('reason' in answer) safe.reason = safeFreeText_(answer.reason, 40);
    if ('customText' in answer) safe.customText = safeFreeText_(answer.customText, 240);
    if ('replacementAdded' in answer) safe.replacementAdded = Boolean(answer.replacementAdded);
    return safe;
  });
}
