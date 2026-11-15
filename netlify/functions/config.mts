const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
async function validSession(request:Request){
 const secret=Netlify.env.get('APP_SESSION_SECRET');if(!secret)return false;
 const raw=request.headers.get('cookie')||'',match=raw.match(/(?:^|;\s*)postpilot_session=([^;]+)/);if(!match)return false;
 const [expiry,signature]=decodeURIComponent(match[1]).split('.');if(!expiry||!signature||Number(expiry)<Date.now())return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const expected=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(expiry)));
 return expected===signature;
}
const json=(body:unknown)=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default async(request:Request)=>json({appAuthConfigured:Boolean(Netlify.env.get('APP_ACCESS_PASSWORD')&&Netlify.env.get('APP_SESSION_SECRET')),sessionValid:await validSession(request),aiConfigured:Boolean(Netlify.env.get('XINGCHI_API_KEY')),xConfigured:Boolean(Netlify.env.get('X_USER_ACCESS_TOKEN')),model:Netlify.env.get('XINGCHI_MODEL')||'gpt-6.1-sol',baseUrl:Netlify.env.get('XINGCHI_BASE_URL')||'https://api.xingchiapi.com/v1'});
