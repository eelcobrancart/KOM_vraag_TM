const $=(s,root=document)=>root.querySelector(s);
const {t,translate}=window.TM_I18N;
const appError=key=>Object.assign(new Error(t(key)),{key});
const countText=(n,one,many)=>`${n} ${t(n===1?one:many)}`;
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

function reaction(item,kind){return item.reactions?.[kind]||(kind==='recognize'?{count:item.recognitions,active:Boolean(item.recognized)}:{count:0,active:false});}
function submissionId(){return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));}
const stamp=()=>new Intl.DateTimeFormat(window.TM_I18N.language==='en'?'en-GB':'nl-NL',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Amsterdam'});
function status(node,key,error=false,values={}){node.dataset.messageKey=key;node.dataset.messageValues=JSON.stringify(values);node.textContent=key?t(key,values):'';node.classList.toggle('error',error);}
async function api(path,method='GET',data){
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),15000);
 try{const response=await fetch(apiBase+path,{method,credentials:apiBase?'omit':'same-origin',headers:{...(apiBase?{'x-tm-browser':browserId}:{}),...(method==='GET'?{}:{'Content-Type':'application/json'})},body:data?JSON.stringify(data):undefined,signal:control.signal});let result;try{result=await response.json();}catch{throw appError(method==='DELETE'?'deleteError':'serverError');}if(!response.ok)throw appError(method==='DELETE'?(response.status===403?'deleteNotAllowed':'deleteError'):(({400:'inputError',403:'originError',404:'notFound',413:'tooLong',415:'invalidRequest',429:'tooMany'})[response.status]||'saveError'));return result;
 }catch(error){if(method==='DELETE'&&(error.name==='AbortError'||error instanceof TypeError))throw appError('deleteError');if(error.name==='AbortError')throw appError('timeoutError');if(error instanceof TypeError)throw appError('networkError');throw error;}finally{clearTimeout(timer);}
}
function author(root,item){$('.avatar',root).textContent=item.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toLocaleUpperCase('nl');$('.author',root).textContent=item.name;const time=$('time',root);time.dateTime=item.created_at;time.textContent=stamp().format(new Date(item.created_at));}
function createReply(reply){const node=document.createElement('div');node.className='reply';const row=document.createElement('div');row.className='author-row';const avatar=document.createElement('span');avatar.className='avatar';avatar.setAttribute('aria-hidden','true');const info=document.createElement('div'),name=document.createElement('h4'),time=document.createElement('time');name.className='author';info.append(name,time);row.append(avatar,info);const body=document.createElement('p');body.className='reply-body';body.textContent=reply.body;node.append(row,body);author(node,reply);return node;}
function remember(name){store.set(name);$('#name').value=name;$('#name').setCustomValidity('');for(const card of cards.values()){const input=$('[name=name]',card);if(document.activeElement!==input){input.value=name;input.setCustomValidity('');}}}
function makeCard(item){
 const card=$('#answer-template').content.firstElementChild.cloneNode(true),form=$('.reply-form',card),toggle=$('.reply-toggle',card);
 translate(card);
 card.id=`insight-${item.id}`;form.id=`reply-${item.id}`;toggle.setAttribute('aria-controls',form.id);toggle.setAttribute('aria-expanded','false');$('[name=name]',form).value=store.get();
 toggle.addEventListener('click',()=>{form.hidden=!form.hidden;toggle.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)$('[name=body]',form).focus();});
 for(const button of card.querySelectorAll('.emoji-reaction'))button.addEventListener('click',async()=>{
 const kind=button.dataset.kind,key=`${item.id}:${kind}`;
 if(busyRecognitions.has(key))return;busyRecognitions.add(key);button.disabled=true;
 const current=state.insights.find(x=>x.id===item.id),active=!reaction(current,kind).active;
 try{await api(`/api/insights/${item.id}/reactions`,'PUT',{kind,active});status($('.recognize-status',card),active?'reactionAdded':'reactionRemoved',false,{kind});await refresh(true);}catch(error){status($('.recognize-status',card),error.key||'saveError',true);}finally{busyRecognitions.delete(key);button.disabled=false;}
 });
 $('.delete-insight',card).addEventListener('click',async()=>{
  const current=state.insights.find(x=>x.id===item.id),button=$('.delete-insight',card);
  if(!current?.can_delete||button.disabled||!window.confirm(t('deleteConfirm')))return;
  button.disabled=true;const label=$('[data-i18n]',button);label.dataset.i18n='deleting';label.textContent=t('deleting');
  try{
   await api(`/api/insights/${item.id}`,'DELETE',{});
   state.insights=state.insights.filter(x=>x.id!==item.id);state.comments=state.comments.filter(x=>x.insight_id!==item.id);
   render();status($('#submit-status'),'deleteSaved');$('#conversation-title').focus({preventScroll:true});await refresh(true);
  }catch(error){status($('.delete-status',card),error.key||'deleteError',true);}finally{button.disabled=false;label.dataset.i18n='deleteOwn';label.textContent=t('deleteOwn');}
 });
 wireForm(form,`/api/insights/${item.id}/comments`,$('.status',form),'replySaved');
 return card;
}
function render(){
 const list=$('#answers'),items=[...state.insights];
 const present=new Set(items.map(x=>x.id));for(const [id,card] of cards)if(!present.has(id)){card.remove();cards.delete(id);}
 if($('#sort').value==='recognized')items.sort((a,b)=>b.recognitions-a.recognitions||b.id-a.id);
 $('#totals').textContent=`${countText(items.length,'answerOne','answerMany')} · ${countText(state.comments.length,'commentOne','commentMany')}`;
 if(!items.length){if(!$('.empty',list)){list.replaceChildren();const empty=document.createElement('div');empty.className='empty';const symbol=document.createElement('span');symbol.className='empty-symbol';symbol.textContent='↗';symbol.setAttribute('aria-hidden','true');const text=document.createElement('p');text.textContent=t('empty');empty.append(symbol,text);list.append(empty);}$('.empty p',list).textContent=t('empty');return;}
 $('.empty',list)?.remove();
 // Keep keyed cards and form nodes intact during polling, including focus and drafts.
 items.forEach((item,index)=>{
 let card=cards.get(item.id);if(!card){card=makeCard(item);cards.set(item.id,card);}
 author(card,item);$('.answer-body',card).textContent=item.body;$('.owner-actions',card).hidden=!item.can_delete;
 for(const button of card.querySelectorAll('.emoji-reaction')){
  const kind=button.dataset.kind,value=reaction(item,kind);
  button.setAttribute('aria-pressed',String(Boolean(value.active)));
  button.setAttribute('aria-label',`${t('reaction_'+kind)}: ${value.count}. ${t(value.active?'removeReaction':'addReaction')}`);
  button.title=t('reaction_'+kind);
  $('.count',button).textContent=value.count;
 }
 const replies=state.comments.filter(x=>x.insight_id===item.id),container=$('.replies',card);
 const signature=window.TM_I18N.language+JSON.stringify(replies);if(container.dataset.signature!==signature){container.replaceChildren(...replies.map(createReply));container.dataset.signature=signature;}
 $('.reply-count',card).textContent=countText(replies.length,'commentOne','commentMany');
 if(list.children[index]!==card){const focused=document.activeElement,selection=focused instanceof HTMLTextAreaElement||focused instanceof HTMLInputElement?[focused.selectionStart,focused.selectionEnd]:null;list.insertBefore(card,list.children[index]||null);if(focused&&card.contains(focused)){focused.focus({preventScroll:true});if(selection)focused.setSelectionRange(...selection);}}
 });
}
async function refresh(force=false){
 if(fetching){await fetching;if(!force)return;}
 const job=(async()=>{try{state=await api('/api/insights');render();loaded=true;status($('#load-status'),'');}catch(error){status($('#load-status'),loaded?'refreshError':(error.key||'serverError'),true);}finally{$('#answers').setAttribute('aria-busy','false');}})();
 fetching=job;try{await job;}finally{if(fetching===job)fetching=null;}
}
function wireForm(form,path,message,confirmation){
 let submitting=false,submission=null,previous=null;
 for(const field of form.querySelectorAll('input,textarea')){field.addEventListener('invalid',()=>{if(field.validity.valueMissing)field.setCustomValidity(t('requiredField'));});field.addEventListener('input',()=>field.setCustomValidity(''));}
 form.addEventListener('submit',async event=>{
 event.preventDefault();if(submitting)return;
 const name=$('[name=name]',form).value.trim(),body=$('[name=body]',form).value.trim();
 if(!name||!body){status(message,'requiredMessage',true);(!name?$('[name=name]',form):$('[name=body]',form)).focus();return;}
 const serialized=JSON.stringify({name,body});if(serialized!==previous){submission=submissionId();previous=serialized;}
 submitting=true;const button=$('button[type=submit]',form),label=$('[data-i18n]',button),original=label.dataset.i18n;button.disabled=true;label.dataset.i18n='sharing';label.textContent=t('sharing');form.setAttribute('aria-busy','true');status(message,'saving');
 // Lock fields briefly, so text typed during submission cannot be cleared unnoticed.
 const fields=[...form.querySelectorAll('input,textarea')];fields.forEach(x=>x.readOnly=true);
 try{await api(path,'POST',{name,body,submission});$('[name=body]',form).value='';remember(name);submission=null;previous=null;status(message,confirmation);await refresh(true);}catch(error){status(message,error.key||'saveError',true);}finally{submitting=false;button.disabled=false;label.dataset.i18n=original;label.textContent=t(original);fields.forEach(x=>x.readOnly=false);form.setAttribute('aria-busy','false');}
 });
}
wireForm($('#insight'),'/api/insights',$('#submit-status'),'insightSaved');
$('#sort').addEventListener('change',render);
$('#name').addEventListener('change',()=>store.set($('#name').value.trim()));
window.addEventListener('tm-language-change',()=>{for(const node of document.querySelectorAll('.status[data-message-key]'))status(node,node.dataset.messageKey,node.classList.contains('error'),JSON.parse(node.dataset.messageValues||'{}'));if(loaded)render();else $('#totals').textContent=t('loadingTotals');});
$('#totals').textContent=t('loadingTotals');status($('#load-status'),'loading');
refresh();setInterval(()=>{if(!document.hidden)refresh();},8000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
