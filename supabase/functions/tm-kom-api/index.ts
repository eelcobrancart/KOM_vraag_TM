// No third-party dependencies. Secrets are injected by Supabase, never shipped to browsers.
const allowedOrigin = 'https://eelcobrancart.github.io';
const rateLimits = new Map<string, { start: number; count: number }>();
const fail = (status: number, message: string) => Object.assign(new Error(message), { status });
const field = (value: unknown, max: number, label: string) => {
 if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
  throw fail(400, `${label} is verplicht en mag maximaal ${max} tekens bevatten.`);
 return value.trim();
};
const uuid = (value: unknown) => {
 if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
  throw fail(400, 'Ongeldige verzendcode. Herlaad de pagina.');
 return value;
};
async function rest(path: string, method = 'GET', body?: unknown, prefer?: string) {
 const url = Deno.env.get('SUPABASE_URL');
 const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if (!url || !key) throw fail(503, 'De databaseverbinding is nog niet beschikbaar. Probeer later opnieuw.');
 const response = await fetch(`${url}/rest/v1/${path}`, {
  method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
 });
 if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  if (error.code === '23503') throw fail(404, 'Dit inzicht is niet gevonden.');
  if (error.code === '23514' || error.code === '22P02') throw fail(400, 'Controleer je naam en tekst en probeer opnieuw.');
  console.error('Database request failed', response.status, error.code || 'unknown');
  throw fail(503, 'Opslaan of ophalen lukt even niet. Je tekst blijft staan. Probeer opnieuw.');
 }
 const text = await response.text();
 return text ? JSON.parse(text) : null;
}
Deno.serve(async (req: Request) => {
 const headers = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-tm-browser',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin',
 };
 const send = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
 try {
  const origin = req.headers.get('Origin');
  if (origin && origin !== allowedOrigin) throw fail(403, 'Deze herkomst is niet toegestaan. Open de gedeelde website.');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/tm-kom-api/, '');
  const token = req.headers.get('x-tm-browser') || '';
  if (token && !/^[0-9a-f]{64}$/.test(token)) throw fail(400, 'Ongeldige browsercode. Herlaad de pagina.');
  const browserHash = token ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map(n => n.toString(16).padStart(2, '0')).join('') : '';
  if (req.method === 'GET' && path === '/api/insights') {
   return send(200, await rest('rpc/tm_kom_snapshot', 'POST', { p_browser: browserHash }));
  }
  if (!['POST','PUT','DELETE'].includes(req.method)) throw fail(405, 'Deze bewerking is niet toegestaan.');
  if (!token) throw fail(400, 'Je browsercode ontbreekt. Herlaad de pagina.');
  if (!req.headers.get('Content-Type')?.startsWith('application/json')) throw fail(415, 'Gebruik een JSON-bericht.');
  const now = Date.now();
  for (const [key,value] of rateLimits) if (now - value.start > 60000) rateLimits.delete(key);
  const rate = rateLimits.get(browserHash) || { start: now, count: 0 };
  if (++rate.count > 40) throw fail(429, 'Je verstuurt veel berichten. Wacht een minuut en probeer opnieuw.');
  rateLimits.set(browserHash, rate);
  // Bound the streamed body before parsing, including chunked requests.
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  if (reader) { while (true) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > 20000) { await reader.cancel(); throw fail(413, 'Je bericht is te lang.'); } chunks.push(value); } }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw fail(400, 'Het bericht kon niet worden gelezen. Probeer opnieuw.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw fail(400, 'Ongeldig bericht.');
  if (req.method === 'POST' && path === '/api/insights') {
   await rest('tm_kom_insights?on_conflict=submission','POST', { submission: uuid(data.submission), owner_hash: browserHash, name: field(data.name,80,'Je naam'), body: field(data.body,6000,'Je inzicht') },'resolution=ignore-duplicates,return=minimal');
   return send(200,{ok:true});
  }
  const deletion = path.match(/^\/api\/insights\/(\d+)$/);
  if (req.method === 'DELETE' && deletion) {
   const id = Number(deletion[1]);
   if (!Number.isSafeInteger(id) || id < 1) throw fail(400, 'Ongeldige bijdrage.');
   const deleted = await rest('rpc/tm_kom_delete_own','POST',{p_id:id,p_browser:browserHash});
   if (!deleted) throw fail(403, 'Deze bijdrage is niet van deze browser of is al verwijderd.');
   return send(200,{ok:true});
  }
  const match = path.match(/^\/api\/insights\/(\d+)\/(comments|recognition|reactions)$/);
  if (!match || !Number.isSafeInteger(Number(match[1]))) throw fail(404, 'Deze bewerking bestaat niet.');
  const id = Number(match[1]);
  if (req.method === 'POST' && match[2] === 'comments') {
   await rest('tm_kom_comments?on_conflict=submission','POST',{submission:uuid(data.submission), insight_id:id, name:field(data.name,80,'Je naam'),body:field(data.body,3000,'Je reactie')},'resolution=ignore-duplicates,return=minimal');
   return send(200,{ok:true});
  }
  if (req.method === 'PUT' && ['recognition','reactions'].includes(match[2])) {
   if (typeof data.active !== 'boolean') throw fail(400, 'Ongeldige herkenning.');
   const kind = match[2] === 'recognition' ? 'recognize' : data.kind;
   if (!['recognize','checked','sad','happy'].includes(kind)) throw fail(400, 'Kies een geldige reactie.');
   if (kind === 'recognize') {
    if (data.active) await rest('tm_kom_recognitions?on_conflict=insight_id,browser_hash','POST',{insight_id:id,browser_hash:browserHash},'resolution=ignore-duplicates,return=minimal');
    else await rest(`tm_kom_recognitions?insight_id=eq.${id}&browser_hash=eq.${browserHash}`,'DELETE');
   } else {
    if (data.active) await rest('tm_kom_emotions?on_conflict=insight_id,browser_hash,kind','POST',{insight_id:id,browser_hash:browserHash,kind},'resolution=ignore-duplicates,return=minimal');
    else await rest(`tm_kom_emotions?insight_id=eq.${id}&browser_hash=eq.${browserHash}&kind=eq.${kind}`,'DELETE');
   }
   return send(200,{ok:true});
  }
  throw fail(405, 'Deze bewerking is niet toegestaan.');
 } catch (error) {
  const e = error as Error & { status?: number };
  return send(e.status || 503, { error: e.status ? e.message : 'De verbinding is tijdelijk niet beschikbaar. Je tekst blijft staan. Probeer opnieuw.' });
 }
});
