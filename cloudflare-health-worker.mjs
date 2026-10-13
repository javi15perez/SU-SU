// Dedicated health Worker. Do not replace the Food AI Worker.
const ORIGIN = 'https://javi15perez.github.io';
const KEY = 'health:latest:v1';
const fields = ['steps','activeKcal','sleepMinutes','sleepMin','weightKg','distanceKm','exerciseMin','restingHr','heartRate','bodyFatPct','bmi','restingKcal'];
function validDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date;
}
function normalize(p) {
  if (!p || p.schemaVersion !== 1 || p.source !== 'Apple Health' || !Array.isArray(p.days) || p.days.length < 1 || p.days.length > 31) throw Error();
  const stamp = Date.parse(p.exportedAt);
  if (typeof p.exportedAt !== 'string' || !Number.isFinite(stamp) || stamp > Date.now()+300000 || Date.now()-stamp > 48*3600000) throw Error();
  const seen = new Set();
  const days = p.days.map(d => {
    if (!d || !validDate(d.date) || seen.has(d.date)) throw Error();
    seen.add(d.date);
    const out = {date:d.date};
    for (const k of fields) if (d[k] !== undefined) {
      if (typeof d[k] !== 'number' || !Number.isFinite(d[k]) || d[k] < 0) throw Error();
      out[k] = d[k];
    }
    if (Object.keys(out).length < 2) throw Error();
    return out;
  });
  return {schemaVersion:1, source:'Apple Health', exportedAt:new Date(stamp).toISOString(), days};
}
export default {
  async fetch(req, env) {
    const headers = {'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin'};
    const reply = (body, status=200) => new Response(JSON.stringify(body), {status,headers});
    if (new URL(req.url).pathname !== '/v1/health') return reply({error:'not_found'},404);
    const origin = req.headers.get('Origin');
    if (origin && origin !== ORIGIN) return reply({error:'origin_not_allowed'},403);
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (!['GET','POST'].includes(req.method)) return reply({error:'method_not_allowed'},405);
    if (!env.HEALTH_KV || !/^[A-Za-z0-9_-]{43}$/.test(env.READ_TOKEN || '') || !/^[A-Za-z0-9_-]{43}$/.test(env.WRITE_TOKEN || '') || env.READ_TOKEN === env.WRITE_TOKEN) return reply({error:'configuration_missing'},503);
    const wanted = req.method === 'GET' ? env.READ_TOKEN : env.WRITE_TOKEN;
    if (req.headers.get('Authorization') !== `Bearer ${wanted}`) return reply({error:'unauthorized'},401);
    try {
      if (req.method === 'GET') {
        const data = await env.HEALTH_KV.get(KEY,'json');
        return data ? reply(data) : reply({error:'no_data'},404);
      }
      if (!(req.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return reply({error:'json_required'},415);
      // Bound the streaming body, including requests without Content-Length.
      const reader=req.body?.getReader(); if (!reader) return reply({error:'invalid_payload'},400);
      let size=0; const chunks=[];
      while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>65536){await reader.cancel();return reply({error:'payload_too_large'},413);} chunks.push(value); }
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      let data;try {data=normalize(JSON.parse(new TextDecoder().decode(bytes)));} catch {return reply({error:'invalid_payload'},400);}
      data.receivedAt = new Date().toISOString();
      // Full snapshot, at most once per minute from the Shortcut. KV is eventually consistent.
      await env.HEALTH_KV.put(KEY,JSON.stringify(data));
      return reply({ok:true,receivedAt:data.receivedAt,days:data.days.length});
    } catch { return reply({error:'temporarily_unavailable'},503); }
  }
};
