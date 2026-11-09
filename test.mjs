import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';

test('gedeelde route, validatie, toegangsregels en persistentie na serverherstart',async()=>{
 const data=await mkdtemp(join(tmpdir(),'tm-test-'));
 let child;
 async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,PORT:'0',HOST:'127.0.0.1',DATA_DIR:data,NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
 // Test port 0 is logged from actual listener by the server.
 let log='';for await(const chunk of child.stdout){log+=chunk;if(/poort (\d+)/.test(log))return `http://127.0.0.1:${log.match(/poort (\d+)/)[1]}`;}
 throw new Error('Server is niet gestart.');
 }
 async function stop(){const closed=once(child,'exit');child.kill('SIGTERM');await closed;}
 try{
 let origin=await start();let cookieA='',cookieB='';
 async function call(path,{who='A',method='GET',data:payload,headers={}}={}){const response=await fetch(origin+path,{method,headers:{Cookie:who==='A'?cookieA:cookieB,...(payload?{'Content-Type':'application/json'}:{}),...headers},body:payload?JSON.stringify(payload):undefined});const cookie=response.headers.get('set-cookie');if(cookie){if(who==='A')cookieA=cookie.split(';')[0];else cookieB=cookie.split(';')[0];}return {status:response.status,data:await response.json()};}
 assert.deepEqual((await call('/api/insights')).data,{insights:[],comments:[]});
 await call('/api/insights',{who:'B'});assert.notEqual(cookieA,cookieB);
 const insight={name:'Leercoach A',body:'Een student zegt: een breder aanbod spreekt mij aan. <script>alert(1)</script>',submission:randomUUID()};
 await Promise.all([call('/api/insights',{method:'POST',data:insight}),call('/api/insights',{method:'POST',data:insight})]);
 let shared=(await call('/api/insights',{who:'B'})).data;assert.equal(shared.insights.length,1);assert.equal(shared.insights[0].body,insight.body);assert.equal(shared.insights[0].submission,undefined);assert.equal(shared.insights[0].owner_hash,undefined);assert.equal(shared.insights[0].can_delete,0);assert.equal((await call('/api/insights')).data.insights[0].can_delete,1);
 const id=shared.insights[0].id;
 const comment={name:'Leercoach B',body:'Dit hoor ik ook tijdens de coaching.',submission:randomUUID()};
 assert.equal((await call(`/api/insights/${id}/comments`,{who:'B',method:'POST',data:comment})).status,200);
 await call(`/api/insights/${id}/comments`,{who:'B',method:'POST',data:comment});
 assert.equal((await call('/api/insights')).data.comments.length,1);
 await Promise.all(Array.from({length:4},()=>call(`/api/insights/${id}/recognition`,{who:'B',method:'PUT',data:{active:true}})));
 shared=(await call('/api/insights',{who:'B'})).data;assert.equal(shared.insights[0].recognitions,1);assert.equal(shared.insights[0].recognized,1);assert.equal((await call('/api/insights')).data.insights[0].recognized,0);
 await call(`/api/insights/${id}/recognition`,{who:'B',method:'PUT',data:{active:false}});assert.equal((await call('/api/insights')).data.insights[0].recognitions,0);
 await call(`/api/insights/${id}/recognition`,{method:'PUT',data:{active:true}});
 assert.equal((await call('/api/insights',{method:'POST',data:{...insight,body:'  ',submission:randomUUID()}})).status,400);
 assert.equal((await call('/api/insights',{method:'POST',data:{...insight,name:'x'.repeat(81),submission:randomUUID()}})).status,400);
 assert.equal((await call('/api/insights',{method:'POST',data:insight,headers:{Origin:'https://wrong.example'}})).status,403);
 assert.equal((await call(`/api/insights/${id}`,{who:'B',method:'DELETE',data:{name:insight.name,owner_hash:'forged'}})).status,403);
 assert.equal((await call(`/api/insights/${id}`,{method:'PUT',data:{body:'gewijzigd'}})).status,404);
 assert.equal((await call('/api/insights/999999/comments',{method:'POST',data:comment})).status,404);
 // Each emoji is independently idempotent, browser-scoped, and retractable.
 for(const kind of ['recognize','checked','sad','happy']){
  for(let repeat=0;repeat<2;repeat++)assert.equal((await call(`/api/insights/${id}/reactions`,{who:'B',method:'PUT',data:{kind,active:true}})).status,200);
 }
 let reactionSnapshot=(await call('/api/insights',{who:'B'})).data.insights[0];
 assert.equal(reactionSnapshot.reactions.recognize.count,2); // A's existing thumb survives.
 for(const kind of ['checked','sad','happy']){assert.equal(reactionSnapshot.reactions[kind].count,1);assert.equal(reactionSnapshot.reactions[kind].active,true);}
 assert.equal((await call('/api/insights',{who:'A'})).data.insights[0].reactions.happy.active,false);
 await call(`/api/insights/${id}/reactions`,{who:'B',method:'PUT',data:{kind:'sad',active:false}});
 await call(`/api/insights/${id}/reactions`,{who:'B',method:'PUT',data:{kind:'recognize',active:false}});
 reactionSnapshot=(await call('/api/insights',{who:'B'})).data.insights[0];
 assert.equal(reactionSnapshot.reactions.sad.count,0);assert.equal(reactionSnapshot.reactions.happy.count,1);assert.equal(reactionSnapshot.recognitions,1);
 assert.equal((await call(`/api/insights/${id}/reactions`,{method:'PUT',data:{kind:'invalid',active:true}})).status,400);
 assert.equal((await call(`/api/insights/${id}/reactions`,{method:'PUT',data:{kind:'happy',active:'true'}})).status,400);
 const logo=await fetch(origin+'/tm-logo.svg');assert.equal(logo.status,200);assert.match(logo.headers.get('content-type'),/image\/svg/);
 const page=await fetch(origin);assert.match(page.headers.get('content-security-policy'),/script-src 'self'/);assert.match(await page.text(),/lang="nl"/);
 await stop();origin=await start();shared=(await call('/api/insights')).data;
 assert.equal(shared.insights.length,1);assert.equal(shared.comments.length,1);assert.equal(shared.insights[0].recognitions,1);assert.equal(shared.insights[0].recognized,1);assert.equal(shared.insights[0].reactions.happy.count,1);assert.equal(shared.insights[0].reactions.sad.count,0);
 // A replay of the original submission cannot transfer ownership to B.
 await call('/api/insights',{who:'B',method:'POST',data:insight});
 assert.equal((await call('/api/insights',{who:'B'})).data.insights[0].can_delete,0);
 const other={name:'Leercoach B',body:'Deze andere bijdrage moet blijven staan.',submission:randomUUID()};
 await call('/api/insights',{who:'B',method:'POST',data:other});
 const fixtureDb=new DatabaseSync(join(data,'tm.sqlite'));
 const legacy=Number(fixtureDb.prepare('INSERT INTO insights(submission,name,body) VALUES(?,?,?)').run(randomUUID(),'Legacy','Bijdrage van vóór de eigenaarschapsfunctie.').lastInsertRowid);
 assert.equal((await call(`/api/insights/${legacy}`,{method:'DELETE',data:{}})).status,403);
 assert.equal((await call(`/api/insights/${id}`,{method:'DELETE',data:{}})).status,200);
 const afterDelete=(await call('/api/insights',{who:'B'})).data;
 assert.equal(afterDelete.insights.some(x=>x.id===id),false);assert.equal(afterDelete.comments.some(x=>x.insight_id===id),false);
 assert.equal(afterDelete.insights.length,2);assert.ok(afterDelete.insights.some(x=>x.body===other.body));
 for(const table of ['comments','emotions','recognitions'])assert.equal(fixtureDb.prepare(`SELECT count(*) AS n FROM ${table} WHERE insight_id=?`).get(id).n,0);
 fixtureDb.close();
 await stop();origin=await start();assert.equal((await call('/api/insights')).data.insights.some(x=>x.id===id),false);
 }finally{if(child?.exitCode===null)await stop();await rm(data,{recursive:true,force:true});}
});
