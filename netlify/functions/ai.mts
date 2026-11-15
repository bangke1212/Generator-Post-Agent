const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
async function validSession(request:Request){
 const secret=Netlify.env.get('APP_SESSION_SECRET');if(!secret)return false;
 const raw=request.headers.get('cookie')||'',match=raw.match(/(?:^|;\s*)postpilot_session=([^;]+)/);if(!match)return false;
 const [expiry,signature]=decodeURIComponent(match[1]).split('.');if(!expiry||!signature||Number(expiry)<Date.now())return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const expected=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(expiry)));
 return expected===signature;
}

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default async(request:Request)=>{
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!await validSession(request))return json({error:'Silakan login ke dashboard terlebih dahulu.'},401);
 const apiKey=Netlify.env.get('XINGCHI_API_KEY');if(!apiKey)return json({error:'XINGCHI_API_KEY belum diatur di Netlify Environment Variables.'},503);
 let input:any;try{input=await request.json();}catch{return json({error:'Body JSON tidak valid.'},400);}
 const prompt=typeof input.prompt==='string'?input.prompt.slice(0,18000):'';if(!prompt.trim())return json({error:'Prompt tidak boleh kosong.'},400);
 const baseUrl=(Netlify.env.get('XINGCHI_BASE_URL')||'https://api.xingchiapi.com/v1').replace(/\/+$/,'');
 const model=Netlify.env.get('XINGCHI_MODEL')||input.model||'gpt-6.1-sol';
 try{
  const upstream=await fetch(`${baseUrl}/chat/completions`,{method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:prompt}],max_tokens:Math.min(Math.max(Number(input.max_tokens)||1200,1),3000),temperature:typeof input.temperature==='number'?Math.min(Math.max(input.temperature,0),2):0.85})});
  const data:any=await upstream.json().catch(()=>({}));if(!upstream.ok)return json({error:data.error?.message||data.message||`Xingchi API error (${upstream.status})`},upstream.status>=500?502:upstream.status);
  const content=data.choices?.[0]?.message?.content;if(typeof content!=='string'||!content.trim())return json({error:'Xingchi mengembalikan respons kosong.'},502);
  return json({content,model});
 }catch{return json({error:'Tidak dapat menghubungi Xingchi API. Periksa Base URL dan koneksi.'},502);}
};
