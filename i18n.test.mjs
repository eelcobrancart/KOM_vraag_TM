import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const source=readFileSync(new URL('./public/i18n.js',import.meta.url),'utf8');
function boot(storage=new Map()){
 const name={value:'Ingevulde naam',dataset:{i18nPlaceholder:'namePlaceholder'}};
 const text={dataset:{i18n:'question'},textContent:''};
 const templateText={dataset:{i18n:'postReply'},textContent:''};
 const code={},en={},nl={},attributes={},events=[];
 let click;
 const button={setAttribute:(k,v)=>attributes[k]=v,querySelector:s=>({'.language-code':code,'.flag-en':en,'.flag-nl':nl})[s],addEventListener:(_,f)=>click=f};
 const document={documentElement:{},title:'',querySelector:s=>s==='#language-toggle'?button:null,querySelectorAll:s=>({'[data-i18n]':[text],'[data-i18n-placeholder]':[name],'[data-i18n-aria]':[],template:[{content:{querySelectorAll:s=>s==='[data-i18n]'?[templateText]:[]}}]})[s]||[]};
 const window={dispatchEvent:e=>events.push(e.type)};
 vm.runInNewContext(source,{window,document,Event,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
 return {i18n:window.TM_I18N,document,click:()=>click(),name,text,templateText,code,en,nl,attributes,events};
}
test('vlag wisselt alle interfacetekst en bewaart taal zonder ingevulde naam te verliezen',()=>{
 const storage=new Map(),app=boot(storage);
 assert.equal(app.document.documentElement.lang,'nl');assert.equal(app.code.textContent,'EN');assert.equal(app.en.hidden,false);
 app.click();
 assert.equal(app.document.documentElement.lang,'en');assert.match(app.text.textContent,/Why do you think/);assert.equal(app.templateText.textContent,'Post comment');assert.equal(app.name.placeholder,'First and last name');assert.equal(app.name.value,'Ingevulde naam');assert.equal(app.code.textContent,'NL');assert.equal(app.nl.hidden,false);assert.equal(app.en.hidden,true);assert.equal(app.attributes['aria-label'],'Schakel naar Nederlands');
 assert.equal(app.i18n.t('reactionAdded',{kind:'happy'}),'Your reaction “Lovely” has been added.');
 assert.equal(boot(storage).i18n.language,'en');
 app.click();assert.equal(app.document.documentElement.lang,'nl');assert.equal(app.templateText.textContent,'Plaats reactie');
 assert.deepEqual(app.events,['tm-language-change','tm-language-change']);
});
test('beide talen dekken dezelfde sleutels en alle labels in de HTML',()=>{
 const {i18n}=boot();assert.deepEqual(Object.keys(i18n.messages.nl).sort(),Object.keys(i18n.messages.en).sort());
 const html=readFileSync(new URL('./public/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/data-i18n(?:-placeholder|-aria)?="([^"]+)"/g))for(const language of ['nl','en'])assert.ok(i18n.messages[language][match[1]],`${language}: ${match[1]}`);
});
test('Pages verwijst naar actuele bestandsinhoud met cachecodes',()=>{
 const html=readFileSync(new URL('./docs/index.html',import.meta.url),'utf8');
 for(const file of ['style.css','app.js','i18n.js','config.js','tm-logo.svg']){
  const hash=createHash('sha256').update(readFileSync(new URL('./docs/'+file,import.meta.url))).digest('hex').slice(0,12);
  assert.ok(html.includes(`./${file}?v=${hash}`),file);
 }
});
