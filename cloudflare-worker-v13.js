const ALLOWED_ORIGIN = "https://javi15perez.github.io";
const MODEL = "gemini-3.5-flash-lite";
const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};
const json = (body, status=200) => new Response(JSON.stringify(body), {status, headers:{...cors,"Content-Type":"application/json"}});
function parseJSONText(t){
  t=String(t||"").replace(/```json|```/g,"").trim();
  const a=t.indexOf("{"), b=t.lastIndexOf("}");
  if(a<0||b<a) throw new Error("No JSON");
  return JSON.parse(t.slice(a,b+1));
}
function valid(x){return x&&typeof x.name==="string"&&[x.kcal,x.protein_g,x.carbs_g,x.fat_g].every(v=>Number.isFinite(Number(v))&&Number(v)>=0)}
export default {
 async fetch(req, env){
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
  if(req.method==="GET") return json({ok:true,service:"SU SU Food AI",model:MODEL,features:["image","image_context","text"]});
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  try{
   const body=await req.json();
   const hasImage=typeof body.image==="string"&&body.image.startsWith("data:image/");
   const hasText=typeof body.text==="string"&&body.text.trim();
   if(!hasImage&&!hasText) return json({error:"image or text required"},400);
   let parts=[];
   if(hasImage){
    const m=body.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if(!m||m[2].length>5500000) return json({error:"invalid image"},400);
    parts.push({text:`Estimate the TOTAL food/drink actually consumed in this image. Identify Thai, Southeast Asian and international foods. ${body.context?`User context (prioritize it when plausible): ${String(body.context).slice(0,500)}`:""} Return ONLY JSON: {"name":"short useful Spanish food name","kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}. Use realistic serving sizes; include oils, sauces and drinks when visible or stated. If uncertain, make a reasonable estimate rather than inventing precision.`});
    parts.push({inline_data:{mime_type:m[1],data:m[2]}});
   } else {
    parts.push({text:`The user is logging food in Spanish and wrote: "${String(body.text).slice(0,1000)}". Interpret foods and quantities, including colloquial language. Estimate the TOTAL consumed. Return ONLY JSON: {"name":"short useful Spanish summary","kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}. If quantities are missing, use a realistic typical serving. Do not add commentary.`});
   }
   const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),20000);
   const url=`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
   let r;
   try{r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:0.2,responseMimeType:"application/json"}}),signal:controller.signal})}finally{clearTimeout(timer)}
   if(!r.ok) return json({error:"Gemini error",status:r.status},502);
   const data=await r.json();
   const out=parseJSONText(data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("\n"));
   if(!valid(out)) return json({error:"Invalid AI response"},502);
   return json({name:out.name,kcal:Number(out.kcal),protein_g:Number(out.protein_g),carbs_g:Number(out.carbs_g),fat_g:Number(out.fat_g)});
  }catch(e){return json({error:e?.name==="AbortError"?"timeout":"request failed"},500)}
 }
}
