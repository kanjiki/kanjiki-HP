(function(root){
  const AXES=['G','H','O','U','L'];
  function calculate(data,answers,questionIds){
    if(!data||!Array.isArray(answers)||!Array.isArray(questionIds)||answers.length!==questionIds.length||answers.length===0) throw new Error('対象設問すべての回答が必要です');
    const scores=Object.fromEntries(AXES.map(k=>[k,0]));
    const confidence=Object.fromEntries(AXES.map(k=>[k,0]));
    let strictnessRaw=0, strictnessMax=0;
    answers.forEach((answer,i)=>{
      const q=data.questions.find(item=>item.id===questionIds[i]);
      const reason=q?.reasons.find(x=>x.id===answer.reason);
      const ruling=q?.rulings.find(x=>x.id===answer.ruling);
      if(!reason||!ruling||ruling.unscored) throw new Error(`Q${questionIds[i]||i+1}の回答が不正です`);
      scores[reason.axis]+=2;
      confidence[reason.axis]+=1;
      const weight=Number.isFinite(q.strictnessWeight)?Math.max(0,q.strictnessWeight):1;
      strictnessRaw+=ruling.strictness*weight;
      strictnessMax+=weight;
    });
    const strictness=strictnessMax?Math.round(strictnessRaw/strictnessMax*100):0;
    const ranked=[...AXES].sort((a,b)=>scores[b]-scores[a]||confidence[b]-confidence[a]||AXES.indexOf(a)-AXES.indexOf(b));
    return {scores,strictness,strictnessRaw,strictnessMax,primary:ranked[0],secondary:ranked[1],code:ranked[0]+ranked[1]};
  }
  root.GHOUL_SCORING={calculate};
})(globalThis);
