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
 const token=Netlify.env.get('X_USER_ACCESS_TOKEN');if(!token)return json({error:'X_USER_ACCESS_TOKEN belum diatur. Tambahkan OAuth 2.0 User Context token dengan izin tweet.write di Netlify.'},503);
 let input:any;try{input=await request.json();}catch{return json({error:'Body JSON tidak valid.'},400);}
 const text=typeof input.text==='string'?input.text.trim():'';if(!text||text.length>280)return json({error:'Post harus berisi 1–280 karakter.'},400);
 try{
  const upstream=await fetch('https://api.x.com/2/tweets',{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({text})});
  const data:any=await upstream.json().catch(()=>({}));if(!upstream.ok)return json({error:data.detail||data.title||'X menolak publikasi. Periksa izin token dan akses API X.'},upstream.status>=500?502:upstream.status);
  return json({success:true,id:data.data?.id,url:data.data?.id?`https://x.com/i/web/status/${data.data.id}`:null});
 }catch{return json({error:'Tidak dapat menghubungi X API.'},502);}
};
