import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
process.umask(0o077);
const root=dirname(fileURLToPath(import.meta.url));
const dbPath=resolve(process.env.DATA_DIR || resolve(root,'data'),'tm.sqlite');
mkdirSync(dirname(dbPath),{recursive:true});
const db=new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
db.exec(readFileSync(resolve(root,'migrations/001-init.sql'),'utf8'));
db.exec(readFileSync(resolve(root,'migrations/002-emotions.sql'),'utf8'));
if(!db.prepare("SELECT name FROM pragma_table_info('insights') WHERE name='owner_hash'").get())db.exec(readFileSync(resolve(root,'migrations/003-ownership.sql'),'utf8'));
const files=new Map([['/i18n.js',['i18n.js','text/javascript; charset=utf-8']],['/tm-logo.svg',['tm-logo.svg','image/svg+xml']],['/',['index.html','text/html; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/config.js',['config.js','text/javascript; charset=utf-8']],['/style.css',['style.css','text/css; charset=utf-8']]]);
const rates=new Map();
const fail=(status,message)=>Object.assign(new Error(message),{status});
const field=(value,max,label)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw fail(400,`${label} is verplicht en mag maximaal ${max} tekens bevatten.`);return value.trim();};
const uuid=v=>{if(typeof v!=='string'||! /^[0-9a-f-]{36}$/i.test(v))throw fail(400,'Ongeldige verzendcode. Herlaad de pagina.');return v;};
const id=v=>{if(!/^\d+$/.test(v)||!Number.isSafeInteger(+v))throw fail(400,'Ongeldige bijdrage.');return +v;};
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
async function json(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>20000)throw fail(413,'Je bericht is te lang.');}try{return JSON.parse(body);}catch{throw fail(400,'Het bericht kon niet worden gelezen. Probeer opnieuw.');}}
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&files.has(url.pathname)){const [file,type]=files.get(url.pathname);res.writeHead(200,{'Content-Type':type});return res.end(readFileSync(resolve(root,'public',file)));}
 if(!url.pathname.startsWith('/api/'))throw fail(404,'Deze pagina bestaat niet.');
 let browser=req.headers.cookie?.match(/(?:^|;\s*)tm_browser=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!browser){browser=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`tm_browser=${browser}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);}
 const browserHash=createHash('sha256').update(browser).digest('hex');
 if(req.method==='GET'&&url.pathname==='/api/insights'){
 let insights=db.prepare(`SELECT i.*, coalesce(i.owner_hash=?,0) AS can_delete, (SELECT count(*) FROM recognitions r WHERE r.insight_id=i.id) AS recognitions, EXISTS(SELECT 1 FROM recognitions r WHERE r.insight_id=i.id AND r.browser=?) AS recognized FROM insights i ORDER BY i.created_at DESC,i.id DESC`).all(browserHash,browserHash).map(({submission,owner_hash,...row})=>row);
 const emotionRows=db.prepare('SELECT insight_id,kind,count(*) AS count,max(CASE WHEN browser=? THEN 1 ELSE 0 END) AS active FROM emotions GROUP BY insight_id,kind').all(browserHash);
 insights=insights.map(item=>({...item,reactions:Object.fromEntries(['recognize','checked','sad','happy'].map(kind=>{
  const row=emotionRows.find(x=>x.insight_id===item.id&&x.kind===kind);
  return [kind,kind==='recognize'?{count:item.recognitions,active:Boolean(item.recognized)}:{count:row?.count||0,active:Boolean(row?.active)}];
 }))}));
 const comments=db.prepare('SELECT id,insight_id,name,body,created_at FROM comments ORDER BY created_at,id').all();
 return send(res,200,{insights,comments});
 }
 if(!['POST','PUT','DELETE'].includes(req.method))throw fail(405,'Deze bewerking is niet toegestaan.');
 if(req.headers['sec-fetch-site']==='cross-site')throw fail(403,'Open de app rechtstreeks om een bijdrage te plaatsen.');
 if(req.headers.origin){const expected=process.env.APP_ORIGIN || `http://${req.headers.host}`;if(req.headers.origin!==expected)throw fail(403,'Deze herkomst is niet toegestaan.');}
 if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Gebruik een JSON-bericht.');
 const now=Date.now();for(const [key,val] of rates){if(now-val.start>60000)rates.delete(key);}
 const rate=rates.get(browserHash)||{start:now,count:0};if(++rate.count>40)throw fail(429,'Je verstuurt veel berichten. Wacht een minuut en probeer opnieuw.');rates.set(browserHash,rate);
 const data=await json(req);
 if(!data||typeof data!=='object'||Array.isArray(data))throw fail(400,'Het bericht moet een geldig object bevatten.');
 if(req.method==='POST'&&url.pathname==='/api/insights'){
 const name=field(data.name,80,'Je naam'),body=field(data.body,6000,'Je inzicht'),submission=uuid(data.submission);
 db.prepare('INSERT INTO insights(submission,name,body,owner_hash) VALUES(?,?,?,?) ON CONFLICT(submission) DO NOTHING').run(submission,name,body,browserHash);
 return send(res,200,{ok:true});
 }
 const deletion=url.pathname.match(/^\/api\/insights\/(\d+)$/);
 if(req.method==='DELETE'&&deletion){
  const parent=id(deletion[1]);db.exec('BEGIN IMMEDIATE');
  try{
   if(!db.prepare('SELECT id FROM insights WHERE id=? AND owner_hash=?').get(parent,browserHash))throw fail(403,'Deze bijdrage is niet van deze browser of is al verwijderd.');
   db.prepare('DELETE FROM comments WHERE insight_id=?').run(parent);
   db.prepare('DELETE FROM emotions WHERE insight_id=?').run(parent);
   db.prepare('DELETE FROM recognitions WHERE insight_id=?').run(parent);
   db.prepare('DELETE FROM insights WHERE id=? AND owner_hash=?').run(parent,browserHash);
   db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return send(res,200,{ok:true});
 }
 const match=url.pathname.match(/^\/api\/insights\/(\d+)\/(comments|recognition|reactions)$/);
 if(!match)throw fail(404,'Deze bewerking bestaat niet.');
 const parent=id(match[1]);if(!db.prepare('SELECT id FROM insights WHERE id=?').get(parent))throw fail(404,'Dit inzicht is niet gevonden.');
 if(req.method==='POST'&&match[2]==='comments'){
 db.prepare('INSERT INTO comments(submission,insight_id,name,body) VALUES(?,?,?,?) ON CONFLICT(submission) DO NOTHING').run(uuid(data.submission),parent,field(data.name,80,'Je naam'),field(data.body,3000,'Je reactie'));return send(res,200,{ok:true});
 }
 if(req.method==='PUT'&&['recognition','reactions'].includes(match[2])){
 if(typeof data.active!=='boolean')throw fail(400,'Ongeldige herkenning.');
 const kind=match[2]==='recognition'?'recognize':data.kind;
 if(!['recognize','checked','sad','happy'].includes(kind))throw fail(400,'Kies een geldige reactie.');
 if(kind==='recognize'){
  if(data.active)db.prepare('INSERT OR IGNORE INTO recognitions(insight_id,browser) VALUES(?,?)').run(parent,browserHash);else db.prepare('DELETE FROM recognitions WHERE insight_id=? AND browser=?').run(parent,browserHash);
 }else{
  if(data.active)db.prepare('INSERT OR IGNORE INTO emotions(insight_id,browser,kind) VALUES(?,?,?)').run(parent,browserHash,kind);else db.prepare('DELETE FROM emotions WHERE insight_id=? AND browser=? AND kind=?').run(parent,browserHash,kind);
 }
 return send(res,200,{ok:true});
 }
 throw fail(405,'Deze bewerking is niet toegestaan.');
 }catch(error){if(!error.status)console.error(error);send(res,error.status||500,{error:error.status?error.message:'Opslaan lukt op dit moment niet. Je tekst blijft staan. Probeer het opnieuw.'});}
});
if(process.env.NODE_ENV!=='test')server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log(`TM-app beschikbaar op poort ${server.address().port}`));
process.on('SIGTERM',()=>server.close(()=>{db.close();process.exit(0);}));
