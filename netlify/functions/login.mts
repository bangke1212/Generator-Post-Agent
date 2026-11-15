const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
export default async(request:Request)=>{
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 const password=Netlify.env.get('APP_ACCESS_PASSWORD'),secret=Netlify.env.get('APP_SESSION_SECRET');
 if(!password||!secret)return json({error:'APP_ACCESS_PASSWORD dan APP_SESSION_SECRET belum diatur di Netlify.'},503);
 let body:any;try{body=await request.json();}catch{return json({error:'Body JSON tidak valid.'},400);}
 if(typeof body.password!=='string'||body.password!==password)return json({error:'Password dashboard salah.'},401);
 const expiry=String(Date.now()+7*24*60*60*1000),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(expiry)));
 return new Response(JSON.stringify({success:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':`postpilot_session=${expiry}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`}});
};
