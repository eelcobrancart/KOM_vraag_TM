import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const endpoint='https://ageaxnonkvrrnnvvsiyq.supabase.co/functions/v1/tm-kom-api';
const target=resolve(root,'docs');
await mkdir(target,{recursive:true});
for(const file of ['index.html','style.css','app.js','i18n.js','tm-logo.svg'])await copyFile(resolve(root,'public',file),resolve(target,file));
await writeFile(resolve(target,'config.js'),`// Public endpoint only; no database passwords or secret keys.\nwindow.TM_API_BASE = ${JSON.stringify(endpoint)};\n`);
let html=await readFile(resolve(target,'index.html'),'utf8');
const csp=`default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://ageaxnonkvrrnnvvsiyq.supabase.co; img-src 'self' data:; base-uri 'none'; form-action 'self'`;
html=html.replace('<meta name="viewport"',`<meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="viewport"`);
// Content hashes in asset URLs prevent stale CSS/JS from mixing with new markup.
for(const file of ['style.css','app.js','i18n.js','config.js','tm-logo.svg']){
 const hash=createHash('sha256').update(await readFile(resolve(target,file))).digest('hex').slice(0,12);
 html=html.replaceAll(`"./${file}"`,`"./${file}?v=${hash}"`);
}
await writeFile(resolve(target,'index.html'),html);
await writeFile(resolve(target,'.nojekyll'),'');
console.log('GitHub Pages-bestanden staan in docs/, met versiecodes voor alle assets.');
