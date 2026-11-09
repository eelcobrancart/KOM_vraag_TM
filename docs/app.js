const $=(s,root=document)=>root.querySelector(s);
const apiBase=window.TM_API_BASE||'';
function browserToken(){
 let token;try{token=localStorage.getItem('tm-browser-token');}catch{}
 if(!/^[a-f0-9]{64}$/.test(token||'')){token=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');try{localStorage.setItem('tm-browser-token',token);}catch{}}
 return token;
}
const browserId=apiBase?browserToken():null;
const store={get(){try{return localStorage.getItem('tm-name')||'';}catch{return '';}},set(v){try{localStorage.setItem('tm-name',v);}catch{}}};
$('#name').value=store.get();
let state={insights:[],comments:[]}, loaded=false, fetching=null;
const cards=new Map(),busyRecognitions=new Set();
const reactionLabels={recognize:'Dit herken ik',checked:'Mee eens',sad:'Jammer',happy:'Mooi'};
function reaction(item,kind){return item.reactions?.[kind]||(kind==='recognize'?{count:item.recognitions,active:Boolean(item.recognized)}:{count:0,active:false});}
function submissionId(){return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));}
const stamp=new Intl.DateTimeFormat('nl-NL',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Amsterdam'});
function status(node,text,error=false){node.textContent=text;node.classList.toggle('error',error);}
async function api(path,method='GET',data){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),15000);
 try{const response=await fetch(apiBase+path,{method,credentials:apiBase?'omit':'same-origin',headers:{...(apiBase?{'x-tm-browser':browserId}:{}),...(method==='GET'?{}:{'Content-Type':'application/json'})},body:data?JSON.stringify(data):undefined,signal:control.signal});let result;try{result=await response.json();}catch{throw new Error('De server is niet bereikbaar. Probeer het opnieuw.');}if(!response.ok)throw new Error(result.error||'Opslaan lukt niet. Probeer opnieuw.');return result;
 }catch(error){if(error.name==='AbortError')throw new Error('De server reageert niet op tijd. Je tekst blijft staan. Probeer opnieuw.');if(error instanceof TypeError)throw new Error('Geen verbinding met de server. Je tekst blijft staan. Probeer opnieuw.');throw error;}finally{clearTimeout(timer);}
}
function author(root,item){$('.avatar',root).textContent=item.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toLocaleUpperCase('nl');$('.author',root).textContent=item.name;const time=$('time',root);time.dateTime=item.created_at;time.textContent=stamp.format(new Date(item.created_at));}
function createReply(reply){const node=document.createElement('div');node.className='reply';const row=document.createElement('div');row.className='author-row';const avatar=document.createElement('span');avatar.className='avatar';avatar.setAttribute('aria-hidden','true');const info=document.createElement('div'),name=document.createElement('h4'),time=document.createElement('time');name.className='author';info.append(name,time);row.append(avatar,info);const body=document.createElement('p');body.className='reply-body';body.textContent=reply.body;node.append(row,body);author(node,reply);return node;}
function remember(name){store.set(name);$('#name').value=name;for(const card of cards.values()){const input=$('[name=name]',card);if(document.activeElement!==input)input.value=name;}}
function makeCard(item){
 const card=$('#answer-template').content.firstElementChild.cloneNode(true),form=$('.reply-form',card),toggle=$('.reply-toggle',card);
 card.id=`insight-${item.id}`;form.id=`reply-${item.id}`;toggle.setAttribute('aria-controls',form.id);toggle.setAttribute('aria-expanded','false');$('[name=name]',form).value=store.get();
 toggle.addEventListener('click',()=>{form.hidden=!form.hidden;toggle.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)$('[name=body]',form).focus();});
 for(const button of card.querySelectorAll('.emoji-reaction'))button.addEventListener('click',async()=>{
 const kind=button.dataset.kind,key=`${item.id}:${kind}`;
 if(busyRecognitions.has(key))return;busyRecognitions.add(key);button.disabled=true;
 const current=state.insights.find(x=>x.id===item.id),active=!reaction(current,kind).active;
 try{await api(`/api/insights/${item.id}/reactions`,'PUT',{kind,active});status($('.recognize-status',card),active?`Je reactie ‘${reactionLabels[kind]}’ is toegevoegd.`:`Je reactie ‘${reactionLabels[kind]}’ is ingetrokken.`);await refresh(true);}catch(error){status($('.recognize-status',card),error.message,true);}finally{busyRecognitions.delete(key);button.disabled=false;}
 });
 wireForm(form,`/api/insights/${item.id}/comments`,$('.status',form),'Je reactie is geplaatst.');
 return card;
}
function render(){
 const list=$('#answers'),items=[...state.insights];
 if($('#sort').value==='recognized')items.sort((a,b)=>b.recognitions-a.recognitions||b.id-a.id);
 $('#totals').textContent=`${items.length} ${items.length===1?'antwoord':'antwoorden'} · ${state.comments.length} ${state.comments.length===1?'reactie':'reacties'}`;
 if(!items.length){if(!$('.empty',list)){list.replaceChildren();const empty=document.createElement('div');empty.className='empty';const symbol=document.createElement('span');symbol.className='empty-symbol';symbol.textContent='↗';symbol.setAttribute('aria-hidden','true');const text=document.createElement('p');text.textContent='Er zijn nog geen inzichten gedeeld. Deel jij de eerste?';empty.append(symbol,text);list.append(empty);}return;}
 $('.empty',list)?.remove();
 // Keep keyed cards and form nodes intact during polling, including focus and drafts.
 items.forEach((item,index)=>{
 let card=cards.get(item.id);if(!card){card=makeCard(item);cards.set(item.id,card);}
 author(card,item);$('.answer-body',card).textContent=item.body;
 for(const button of card.querySelectorAll('.emoji-reaction')){
  const kind=button.dataset.kind,value=reaction(item,kind);
  button.setAttribute('aria-pressed',String(Boolean(value.active)));
  button.setAttribute('aria-label',`${reactionLabels[kind]}: ${value.count}. ${value.active?'Klik om jouw reactie in te trekken.':'Klik om te reageren.'}`);
  $('.count',button).textContent=value.count;
 }
 const replies=state.comments.filter(x=>x.insight_id===item.id),container=$('.replies',card);
 const signature=JSON.stringify(replies);if(container.dataset.signature!==signature){container.replaceChildren(...replies.map(createReply));container.dataset.signature=signature;}
 $('.reply-count',card).textContent=`${replies.length} ${replies.length===1?'reactie':'reacties'}`;
 if(list.children[index]!==card){const focused=document.activeElement,selection=focused instanceof HTMLTextAreaElement||focused instanceof HTMLInputElement?[focused.selectionStart,focused.selectionEnd]:null;list.insertBefore(card,list.children[index]||null);if(focused&&card.contains(focused)){focused.focus({preventScroll:true});if(selection)focused.setSelectionRange(...selection);}}
 });
}
async function refresh(force=false){
 if(fetching){await fetching;if(!force)return;}
 const job=(async()=>{try{state=await api('/api/insights');render();loaded=true;status($('#load-status'),'');}catch(error){status($('#load-status'),loaded?'Verversen lukt even niet. De getoonde bijdragen blijven staan; we proberen het automatisch opnieuw.':error.message,true);}finally{$('#answers').setAttribute('aria-busy','false');}})();
 fetching=job;try{await job;}finally{if(fetching===job)fetching=null;}
}
function wireForm(form,path,message,confirmation){
 let submitting=false,submission=null,previous=null;
 form.addEventListener('submit',async event=>{
 event.preventDefault();if(submitting)return;
 const name=$('[name=name]',form).value.trim(),body=$('[name=body]',form).value.trim();
 if(!name||!body){status(message,'Vul je naam en een tekst in. Alleen spaties zijn niet voldoende.',true);(!name?$('[name=name]',form):$('[name=body]',form)).focus();return;}
 const serialized=JSON.stringify({name,body});if(serialized!==previous){submission=submissionId();previous=serialized;}
 submitting=true;const button=$('button[type=submit]',form),original=button.innerHTML;button.disabled=true;button.textContent='Bezig met delen…';form.setAttribute('aria-busy','true');status(message,'Je bijdrage wordt opgeslagen…');
 // Lock fields briefly, so text typed during submission cannot be cleared unnoticed.
 const fields=[...form.querySelectorAll('input,textarea')];fields.forEach(x=>x.readOnly=true);
 try{await api(path,'POST',{name,body,submission});$('[name=body]',form).value='';remember(name);submission=null;previous=null;status(message,confirmation);await refresh(true);}catch(error){status(message,error.message,true);}finally{submitting=false;button.disabled=false;button.innerHTML=original;fields.forEach(x=>x.readOnly=false);form.setAttribute('aria-busy','false');}
 });
}
wireForm($('#insight'),'/api/insights',$('#submit-status'),'Bedankt! Je inzicht is gedeeld en zichtbaar voor collega’s.');
$('#sort').addEventListener('change',render);
$('#name').addEventListener('change',()=>store.set($('#name').value.trim()));
refresh();setInterval(()=>{if(!document.hidden)refresh();},8000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
