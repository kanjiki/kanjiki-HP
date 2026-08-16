(function(){
  document.addEventListener('input',event=>{if(event.target.id==='participant-name'){state.participantName=event.target.value;save();}},true);
  document.addEventListener('click',event=>{const button=event.target.closest('[data-action="start"]');if(!button)return;const input=document.querySelector('#participant-name'),name=input?.value.trim();if(!name){event.stopImmediatePropagation();input?.focus();document.querySelector('.name-entry')?.classList.add('invalid');return}setTimeout(()=>{state.participantName=name;save();},0);},true);
})();
