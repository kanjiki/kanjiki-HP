const app = document.querySelector('#app');
const STORAGE_KEY = 'ghoul-kp-style-v1-2';
globalThis.GHOUL_TEST_VERSION='1.2';
globalThis.GHOUL_QUESTION_SET_VERSION='2026-08-17a';
const AXIS_ORDER = ['G','H','O','U','L'];
const CORE_IDS = [1,3,5,6,9,10,14,16,18,19];
const EXTRA_IDS = [4,13,20];
const REPLACEMENT_IDS = [2,8,17];
const FULL_IDS = Array.from({length:20},(_,i)=>i+1);
let data;
let state = { screen: 'home', index: 0, answers: [], extended: false, mode: null, questionIds: [], replacementsUsed: 0, participantName: '', resultId: '' };
let lastResult = null;

const escapeHtml = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){ try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved?.answers){state={...state,...saved};if(!state.questionIds?.length)state.questionIds=state.mode==='full'?[...FULL_IDS]:[...CORE_IDS];} } catch {} }
function sequence(){ return state.questionIds?.length?state.questionIds:(state.mode==='full'?FULL_IDS:CORE_IDS); }
function currentQuestion(){ return data.questions.find(q=>q.id===sequence()[state.index]); }
function isCustom(answer){ return answer?.ruling==='custom'; }
function rulingFor(id,answer){ const q=data?.questions.find(item=>item.id===id); return q?.rulings.find(r=>r.id===answer?.ruling); }
function isUnscored(answer,id=sequence()[state.index]){ return Boolean(rulingFor(id,answer)?.unscored); }
function scoredEntries(){ return sequence().map((id,i)=>({id,answer:state.answers[i]})).filter(x=>x.answer&&!isCustom(x.answer)&&!isUnscored(x.answer,x.id)&&x.answer.reason); }
function customCount(){ return sequence().filter((_,i)=>isCustom(state.answers[i])).length; }
function unscoredCount(){ return sequence().filter((id,i)=>isUnscored(state.answers[i],id)).length; }
function axisPills(){ return AXIS_ORDER.map(k=>`<span class="axis-pill"><b>${k}</b>${escapeHtml(data.axes[k].english)}</span>`).join(''); }
function strictnessGuide(){ return `<section class="strictness-guide"><span class="eyebrow">Ruling stance</span><h2>もう一つの指標「厳格度指数」</h2><p>GHOULが「何を大切にするか」を表すのに対し、厳格度指数は<strong>裁定をどちらへ動かしやすいか</strong>を-100〜+100で表します。クイック版と詳細版を比較できるよう回答数で正規化しています。</p><div><span><b>＋ 成立探索</b>提案や救済が成立する条件を探しやすい</span><span><b>± 条件調整</b>代償・条件・折衷案を置きやすい</span><span><b>− 境界維持</b>既定条件・失敗・因果を保ちやすい</span></div><small>人柄の優しさ・厳しさや、KPの上手さを評価する数値ではありません。</small></section>`; }

function renderHome(){
  const resumable=state.answers.some(Boolean)&&state.screen!=='result'&&state.mode;
  app.innerHTML=`<section class="home-wrap"><div class="hero-copy"><div class="eyebrow">Call of Cthulhu Keeper Profile</div><h1 class="home-title">GHOUL<span>STYLE TEST</span></h1><p class="lead">KPとして迷ったとき、何を一番大切にするか。実際の卓を思い浮かべながら答えてください。</p></div><section class="ghoul-guide" aria-labelledby="ghoul-guide-title"><div class="guide-intro"><span class="eyebrow">What is GHOUL?</span><h2 id="ghoul-guide-title">5つの「判断のよりどころ」</h2><p>得点が高いほど、迷ったときにその基準を先に守りやすいことを表します。能力の高さや、KPとしての善悪を決めるものではありません。</p></div><div class="guide-axes"><div><b>G</b><span><strong>Game</strong>判定・難易度・公平さ</span></div><div><b>H</b><span><strong>Host</strong>PLの納得・安心・参加感</span></div><div><b>O</b><span><strong>Orchestration</strong>物語・演出・テンポ</span></div><div><b>U</b><span><strong>Unscripted</strong>想定外・即興・自由な提案</span></div><div><b>L</b><span><strong>Logic</strong>世界の因果・NPCの心理・自然さ</span></div></div></section>${resumable?`<button class="btn btn-primary resume" data-action="resume">${state.mode==='full'?'詳細':'クイック'}診断の続きを回答する</button>`:''}<div class="mode-grid"><article class="mode-card recommended"><span class="mode-label">おすすめ</span><h2>クイック診断</h2><p class="mode-count">10問 <small>約5分</small></p><p>裁定の違いが出やすい場面を厳選。結果が僅差のときだけ3問を追加します。</p><ul><li>探索・戦闘・NPC・ルール・撤退判断を網羅</li><li>独自裁定には最大3問を補充</li></ul><button class="btn btn-primary" data-action="start" data-mode="quick">クイック診断を始める</button></article><article class="mode-card"><span class="mode-label">じっくり</span><h2>詳細診断</h2><p class="mode-count">20問 <small>約10分</small></p><p>すべての場面に回答し、結果の揺れを小さくします。</p><ul><li>全20設問を使用</li><li>比較や検証にも向く詳細版</li></ul><button class="btn btn-secondary" data-action="start" data-mode="full">詳細診断を始める</button></article></div></section>`;
  app.querySelector('.mode-grid')?.insertAdjacentHTML('beforebegin',strictnessGuide());
  app.querySelector('.mode-grid')?.insertAdjacentHTML('beforebegin',`<section class="name-entry"><label for="participant-name">診断結果に表示する名前</label><input id="participant-name" maxlength="30" autocomplete="nickname" placeholder="例：山田KP、匿名希望" value="${escapeHtml(state.participantName||'')}"><small>結果画像と運営者向け集計に記録されます。本名でなくても構いません。</small></section>`);
}

function renderQuiz(){
  const q=currentQuestion(), answer=state.answers[state.index]||{}, total=sequence().length;
  const choices=(items,kind)=>items.map(item=>`<label class="choice ${answer[kind]===item.id?'selected':''}"><input type="radio" name="${kind}" value="${item.id}" ${answer[kind]===item.id?'checked':''}><span class="choice-key">${item.id}</span><span class="choice-text">${escapeHtml(item.text)}${item.unscored?'<small>この設問は採点対象外になります</small>':''}</span></label>`).join('');
  const custom=`<label class="choice custom-choice ${isCustom(answer)?'selected':''}"><input type="radio" name="ruling" value="custom" ${isCustom(answer)?'checked':''}><span class="choice-key">D</span><span class="choice-text"><strong>別の裁定を考えた</strong><small>選択肢へ無理に合わせず、自分の案を残します</small></span></label>`;
  const customEditor=isCustom(answer)?`<div class="custom-editor"><label for="custom-text">あなたなら、どう裁定しますか？ <small>任意の詳しさで構いません</small></label><textarea id="custom-text" maxlength="240" placeholder="例：まずPLに意図を確認してから、状況に応じて決める">${escapeHtml(answer.customText||'')}</textarea><span>${(answer.customText||'').length} / 240</span></div>`:'';
  const unscored=isUnscored(answer,q.id);
  const ready=isCustom(answer)?Boolean(answer.customText?.trim()):unscored?Boolean(answer.ruling):Boolean(answer.ruling&&answer.reason);
  app.innerHTML=`<section class="quiz"><div class="progress-row"><span class="progress-text">QUESTION ${String(state.index+1).padStart(2,'0')} / ${total}${state.extended?' · 追加判定':''}</span><div class="progress-track"><div class="progress-fill" style="width:${(state.index+1)/total*100}%"></div></div></div><article class="question-card"><span class="q-number">Q.${q.id}</span><h1>${escapeHtml(q.title)}</h1><p class="scene">${escapeHtml(q.scene)}</p><fieldset class="choice-group"><legend>あなたなら、どう裁定しますか？</legend>${choices(q.rulings,'ruling')}${custom}</fieldset>${customEditor}${!isCustom(answer)&&!unscored?`<div class="reason-block"><fieldset class="choice-group"><legend>その裁定で、最も守りたいものは？</legend>${choices(q.reasons,'reason')}</fieldset></div>`:''}<div class="quiz-actions"><button class="btn btn-secondary" data-action="back">${state.index===0?'最初へ':'前の問い'}</button><button class="btn btn-primary" data-action="next" ${ready?'':'disabled'}>${state.index===total-1?'判定する':'次の問い'}</button></div></article></section>`;
}

function calculate(){
  const entries=scoredEntries();
  if(!entries.length)return null;
  return window.GHOUL_SCORING.calculate(data,entries.map(x=>x.answer),entries.map(x=>x.id));
}
function needsExtra(){ const result=calculate();if(!result)return false;const values=Object.values(result.scores).sort((a,b)=>b-a);return values[0]-values[1]<=2; }
function appendReplacement(){
  if(state.mode!=='quick'||(!isCustom(state.answers[state.index])&&!isUnscored(state.answers[state.index]))||state.answers[state.index].replacementAdded||state.replacementsUsed>=3)return false;
  const next=REPLACEMENT_IDS.find(id=>!sequence().includes(id));if(!next)return false;
  state.answers[state.index].replacementAdded=true;state.questionIds.push(next);state.replacementsUsed++;return true;
}
function strictnessLabel(value){ return value>=20?['成立探索型','提案や救済が成立する条件を探しやすい。']:value<=-20?['境界維持型','既定条件・失敗・因果の境界を維持しやすい。']:['条件調整型','条件・代償・折衷案を置きやすい。']; }
function drawRadar(result){
  const canvas=document.querySelector('#radar'), dpr=devicePixelRatio||1, size=420; canvas.width=size*dpr;canvas.height=size*dpr; const c=canvas.getContext('2d');c.scale(dpr,dpr); const center=size/2,r=145,max=Math.max(...Object.values(result.scores),1); c.translate(center,center);
  for(let ring=1;ring<=4;ring++){c.beginPath();AXIS_ORDER.forEach((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,x=Math.cos(a)*r*ring/4,y=Math.sin(a)*r*ring/4;i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.strokeStyle='#33453b';c.stroke()}
  AXIS_ORDER.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.strokeStyle='#2b3a32';c.stroke();c.fillStyle='#e9eadf';c.font='700 16px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(k,Math.cos(a)*(r+25),Math.sin(a)*(r+25));});
  c.beginPath();AXIS_ORDER.forEach((k,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,rr=r*result.scores[k]/max,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fillStyle='#c8e16b33';c.fill();c.strokeStyle='#c8e16b';c.lineWidth=2;c.stroke();
}
function resultShareText(){
  if(!lastResult)return '';
  const {result,type,strict}=lastResult;
  return `私のGHOUL KP STYLEは「${result.code}：${type.name}」でした。\nG ${result.scores.G} / H ${result.scores.H} / O ${result.scores.O} / U ${result.scores.U} / L ${result.scores.L}\n厳格度指数 ${result.strictness>0?'+':''}${result.strictness}（${strict[0]}）\n#GHOUL_KP_STYLE`;
}
function resultImageCanvas(){
  const {result,type,strict}=lastResult,canvas=document.createElement('canvas'),c=canvas.getContext('2d');canvas.width=1200;canvas.height=630;
  const grad=c.createLinearGradient(0,0,1200,630);grad.addColorStop(0,'#101714');grad.addColorStop(1,'#26382d');c.fillStyle=grad;c.fillRect(0,0,1200,630);c.strokeStyle='#c8e16b';c.lineWidth=2;c.strokeRect(38,38,1124,554);
  c.fillStyle='#c8e16b';c.font='700 24px Georgia, serif';c.fillText('GHOUL KP STYLE TEST',78,96);c.fillStyle='#e9eadf';c.font='700 150px Georgia, serif';c.fillText(result.code,72,276);c.fillStyle='#c8e16b';c.font='700 44px "Yu Gothic UI", sans-serif';c.fillText(type.name,78,345);
  c.fillStyle='#b9c4bb';c.font='26px "Yu Gothic UI", sans-serif';c.fillText(`G ${result.scores.G}   H ${result.scores.H}   O ${result.scores.O}   U ${result.scores.U}   L ${result.scores.L}`,80,428);c.fillStyle='#e3b968';c.font='700 28px "Yu Gothic UI", sans-serif';c.fillText(`厳格度指数 ${result.strictness>0?'+':''}${result.strictness}  ·  ${strict[0]}`,80,486);
  c.fillStyle='#8e9a91';c.font='20px "Yu Gothic UI", sans-serif';c.fillText('何を大切にし、裁定をどちらへ動かしやすいか。',80,548);c.textAlign='right';c.fillText('#GHOUL_KP_STYLE',1120,548);return canvas;
}
function downloadResultImage(){const a=document.createElement('a');a.download=`GHOUL-${lastResult.result.code}.png`;a.href=resultImageCanvas().toDataURL('image/png');a.click();}
async function shareResultImage(){const canvas=resultImageCanvas(),blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png')),file=new File([blob],`GHOUL-${lastResult.result.code}.png`,{type:'image/png'});if(navigator.canShare?.({files:[file]}))await navigator.share({title:'GHOUL KP STYLE TEST',text:resultShareText(),files:[file]});else downloadResultImage();}

function renderResult(){
  const result=calculate();
  if(!result){const customs=customCount(),unscored=unscoredCount();app.innerHTML=`<section class="result-wrap empty-result"><div class="eyebrow">Unscored Rulings</div><h1 class="result-name">GHOULタイプを算出できませんでした</h1><p class="result-desc">採点できる回答がなかったため、5軸の得点がありません。独自裁定や「この前提を採用していない」という回答は無理に5軸へ割り当てません。</p><div class="result-metrics"><div><b>0</b><span>採点した回答</span></div><div><b>${customs}</b><span>独自裁定</span></div>${unscored?`<div><b>${unscored}</b><span>対象外</span></div>`:''}</div><div class="quiz-actions"><button class="btn btn-secondary" data-action="restart">診断を選び直す</button><button class="btn btn-primary" data-action="review">回答を見直す</button></div></section>`;return;}
  const type=data.types[result.code], strict=strictnessLabel(result.strictness);lastResult={result,type,strict};
  state.lastCalculated={strictnessIndex:result.strictness,strictnessRaw:result.strictnessRaw,strictnessMax:result.strictnessMax};save();
  const valid=scoredEntries().length, customs=customCount(), unscored=unscoredCount(), rate=Math.round(customs/sequence().length*100), reference=(state.mode==='full'&&(customs+unscored)>3)||(state.mode==='quick'&&valid<10);
  const scores=AXIS_ORDER.map(k=>`<div class="score ${k===result.primary?'primary':''}"><b>${k} ${result.scores[k]}</b><small>${escapeHtml(data.axes[k].english)}</small></div>`).join('');
  const reviews=sequence().map((id,i)=>{const q=data.questions.find(item=>item.id===id),a=state.answers[i];if(isCustom(a))return `<details><summary>Q${q.id}. ${escapeHtml(q.title)}</summary><p>${escapeHtml(a.customText)}</p><div class="review-tags"><span class="review-tag">独自裁定・採点対象外</span></div></details>`;const ruling=q.rulings.find(x=>x.id===a?.ruling);if(ruling?.unscored)return `<details><summary>Q${q.id}. ${escapeHtml(q.title)}</summary><p>${escapeHtml(ruling.text)}</p><div class="review-tags"><span class="review-tag">対象外・採点なし</span></div></details>`;const reason=q.reasons.find(x=>x.id===a?.reason);return `<details><summary>Q${q.id}. ${escapeHtml(q.title)}</summary><p>${escapeHtml(ruling?.text||'')}</p><div class="review-tags"><span class="review-tag">裁定 ${ruling?.id||'-'} / ${ruling?.strictness>0?'+':''}${ruling?.strictness??0}</span><span class="review-tag">理由 ${reason?.id||'-'} / ${reason?.axis||'-'}</span></div></details>`}).join('');
  app.innerHTML=`<section class="result-wrap">${reference?'<div class="reference-note"><strong>この結果は参考値です</strong><span>独自裁定または採点対象外の回答が多く、通常回答が少なくなっています。</span></div>':''}<div class="result-head"><div><div class="eyebrow">${state.mode==='full'?'Detailed':'Quick'} Keeper Profile · 有効回答 ${valid}問</div><div class="result-title">${result.code}</div><h1 class="result-name">${escapeHtml(type.name)}</h1><p class="result-desc">${escapeHtml(type.description)}</p></div><div class="chart-wrap"><canvas id="radar" role="img" aria-label="GHOUL 5軸得点レーダーチャート"></canvas></div></div><div class="score-grid">${scores}</div><div class="result-metrics"><div><b>${valid}</b><span>採点した回答</span></div><div><b>${customs}</b><span>独自裁定</span></div>${unscored?`<div><b>${unscored}</b><span>対象外</span></div>`:''}<div><b>${rate}%</b><span>独自裁定率</span></div></div><p class="metric-note">独自裁定率は、用意された三択に収まりにくかった割合です。即興力やKPの優劣を示す数値ではありません。</p><div class="strictness"><div class="strictness-value">${result.strictness>0?'+':''}${result.strictness}</div><div><h3>${strict[0]}</h3><p>${strict[1]} 優しさ・厳しさの人格評価ではありません。</p></div></div><div class="quiz-actions"><button class="btn btn-secondary" data-action="restart">診断を選び直す</button><button class="btn btn-primary" data-action="review">回答を見直す</button></div><section class="answer-review"><h2>回答一覧</h2>${reviews}</section></section>`;
  const strictBody=app.querySelector('.strictness>div:last-child');
  strictBody?.insertAdjacentHTML('beforeend','<p class="strictness-detail">指数は-100〜+100。＋は成立条件を探す方向、−は既定の失敗や因果を保つ方向です。0に近いほど、条件や代償で調整する傾向があります。</p><p class="strictness-caution">人柄の優しさ・厳しさや、KPの上手さを示す評価ではありません。</p>');
  app.querySelector('.strictness')?.insertAdjacentHTML('afterend','<section class="share-panel"><div><span class="eyebrow">Share your result</span><h2>診断結果を共有する</h2><p>Xでは結果文と診断URLを共有できます。画像は保存後、投稿へ添付してください。</p></div><div class="share-actions"><button class="btn btn-primary" data-action="share-x">X（Twitter）で共有</button><button class="btn btn-secondary" data-action="save-image">結果画像を保存</button><button class="btn btn-secondary native-share" data-action="share-image">画像を端末で共有</button></div></section>');
  if(!navigator.share)app.querySelector('.native-share')?.remove();
  requestAnimationFrame(()=>drawRadar(result));
}
function render(){ if(!data)return; state.screen==='quiz'?renderQuiz():state.screen==='result'?renderResult():renderHome(); app.focus({preventScroll:true}); }

document.addEventListener('change',e=>{ if(!e.target.matches('input[type=radio]'))return; const current=state.answers[state.index]||{};current[e.target.name]=e.target.value;if(e.target.name==='ruling'){if(e.target.value==='custom'){delete current.reason}else{delete current.customText;delete current.replacementAdded;if(isUnscored(current))delete current.reason}}state.answers[state.index]=current;save();renderQuiz(); });
document.addEventListener('input',e=>{if(e.target.id!=='custom-text')return;const current=state.answers[state.index]||{};current.customText=e.target.value;state.answers[state.index]=current;save();const count=e.target.parentElement.querySelector('span');if(count)count.textContent=`${e.target.value.length} / 240`;const next=document.querySelector('[data-action="next"]');if(next)next.disabled=!e.target.value.trim();});
document.addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;if(action==='home'){state.screen='home'}if(action==='resume'){state.screen='quiz'}if(action==='start'){const mode=button.dataset.mode;state={screen:'quiz',index:0,answers:[],extended:false,mode,questionIds:mode==='full'?[...FULL_IDS]:[...CORE_IDS],replacementsUsed:0,participantName:state.participantName||'',resultId:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}}if(action==='back'){if(state.index===0)state.screen='home';else state.index--}if(action==='next'){appendReplacement();const last=state.index===sequence().length-1;if(last&&state.mode==='quick'&&!state.extended&&needsExtra()){state.extended=true;for(const id of EXTRA_IDS)if(!state.questionIds.includes(id))state.questionIds.push(id);state.index++}else if(last){state.screen='result'}else state.index++}if(action==='review'){state.screen='quiz';state.index=0}if(action==='restart'){state={screen:'home',index:0,answers:[],extended:false,mode:null,questionIds:[],replacementsUsed:0,participantName:state.participantName||'',resultId:''}}save();render();window.scrollTo({top:0,behavior:'smooth'});});

try { data=window.GHOUL_DATA; if(!data)throw Error('missing data');load();if(state.screen==='result'&&state.answers.filter(Boolean).length!==sequence().length)state.screen='home';render(); } catch { app.innerHTML='<p class="error">診断データを読み込めませんでした。ghoul-data.jsが同じフォルダーにあるか確認してください。</p>'; }
