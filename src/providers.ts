export interface ModelConfig { id:string; name:string; free?:boolean; temperature:number; maxTokens:number; strengths:string[]; bestFor:string; }
export interface ProviderConfig { name:string; icon:string; baseUrl:string; docs?:string; models:ModelConfig[]; rateLimitNote?:string; }
export const PROVIDER_PRESETS:Record<string,ProviderConfig>={xingchi:{name:'Xingchi API',icon:'✦',baseUrl:'https://api.xingchiapi.com/v1',docs:'https://xingchiapi.com/dashboard',rateLimitNote:'API key disimpan aman di Netlify Environment Variables.',models:[{id:'gpt-6.1-sol',name:'GPT-6.1 Sol · Xingchi',temperature:0.85,maxTokens:1400,strengths:['creative','natural_id','reasoning'],bestFor:'Generator post Bahasa Indonesia'}]}};
export interface GenerateParams {provider:string;apiKey?:string;baseUrl?:string;model:string;prompt:string;maxTokens?:number;temperature?:number;}
export interface ModelOptimalParams {temperature:number;maxTokens:number;}
export function getModelParams(provider:string,model:string):ModelOptimalParams {const m=PROVIDER_PRESETS[provider]?.models.find(x=>x.id===model);return m?{temperature:m.temperature,maxTokens:m.maxTokens}:{temperature:0.85,maxTokens:1400};}
export function getModelProfile(provider:string,model:string):ModelConfig|null{return PROVIDER_PRESETS[provider]?.models.find(x=>x.id===model)||null;}
export async function callAI(params:GenerateParams):Promise<{content:string;provider:string;model:string}>{
 const response=await fetch('/.netlify/functions/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:params.prompt,model:params.model,max_tokens:params.maxTokens,temperature:params.temperature})});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`AI request failed (${response.status})`);
 return {content:data.content||'',provider:'Xingchi API',model:data.model||params.model};
}
export async function testConnection():Promise<{success:boolean;error?:string}>{try{const r=await fetch('/.netlify/functions/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Balas hanya dengan OK.',max_tokens:20,temperature:0})});const d=await r.json().catch(()=>({}));return r.ok&&!!d.content?{success:true}:{success:false,error:d.error||'Koneksi gagal'};}catch(e){return{success:false,error:e instanceof Error?e.message:'Koneksi gagal'};}}
