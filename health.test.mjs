import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const source=stripTypeScriptTypes(readFileSync(new URL('./supabase/functions/tm-kom-api/index.ts',import.meta.url),'utf8'));
function handlerWith(response){
 let handler;const requests=[];
 vm.runInNewContext(source,{Deno:{serve:f=>handler=f,env:{get:key=>({SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'dummy-test-key'})[key]}},Response,Request,URL,AbortSignal,TextEncoder,TextDecoder,Uint8Array,crypto,console:{error(){}},fetch:async(url,options)=>{requests.push({url,method:options.method});return response;}});
 return {handler,requests};
}
test('health voert een minimale leesopdracht uit zonder gegevens terug te geven',async()=>{
 const app=handlerWith(new Response(JSON.stringify([{id:42,name:'Private test name'}]),{status:200}));
 const response=await app.handler(new Request('https://test.invalid/functions/v1/tm-kom-api/api/health?check=123'));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(app.requests.length,1);assert.equal(app.requests[0].method,'GET');assert.equal(app.requests[0].url,'https://test.invalid/rest/v1/tm_kom_insights?select=id&limit=1');
});
test('health meldt een databasefout als fout zonder interne details prijs te geven',async()=>{
 const app=handlerWith(new Response(JSON.stringify({message:'private database details',code:'ERROR'}),{status:503}));
 const response=await app.handler(new Request('https://test.invalid/functions/v1/tm-kom-api/api/health'));
 assert.equal(response.status,503);assert.equal(app.requests.length,1);const body=await response.json();assert.equal(body.ok,undefined);assert.equal(typeof body.error,'string');assert.ok(!JSON.stringify(body).includes('private database details'));
});
