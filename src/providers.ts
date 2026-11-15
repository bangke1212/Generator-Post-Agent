export interface ModelConfig { id:string; name:string; free?:boolean; temperature:number; maxTokens:number; strengths:string[]; bestFor:string; recommendation?:string; }
export interface ProviderConfig { name:string; icon:string; baseUrl:string; docs?:string; models:ModelConfig[]; rateLimitNote?:string; }
export const PROVIDER_PRESETS:Record<string,ProviderConfig>={
 xingchi:{name:'OpenAI · via Xingchi',icon:'✦',baseUrl:'https://api.xingchiapi.com/v1',docs:'https://xingchiapi.com/dashboard',rateLimitNote:'Model yang tersedia mengikuti paket dan daftar model pada akun Xingchi Anda.',models:[
  {id:'gpt-6-astra',name:'GPT-6 Astra',temperature:0.9,maxTokens:1600,strengths:['creative','natural_id','reasoning','deep_reasoning','debate'],bestFor:'Hook kuat, ide orisinal, opini tajam, dan variasi konten kompleks.',recommendation:'Kualitas terbaik'},
  {id:'gpt-6.1-sol',name:'GPT-6.1 Sol',temperature:0.85,maxTokens:1400,strengths:['creative','natural_id','reasoning'],bestFor:'Generator post harian dengan keseimbangan kualitas dan biaya.',recommendation:'Rekomendasi utama'},
  {id:'gpt-6.1-terra',name:'GPT-6.1 Terra',temperature:0.85,maxTokens:1200,strengths:['natural_id','creative'],bestFor:'Copywriting natural, ringkas, dan cepat.',recommendation:'Natural & cepat'},
  {id:'gpt-6-sol',name:'GPT-6 Sol',temperature:0.85,maxTokens:1400,strengths:['creative','natural_id','reasoning'],bestFor:'Alternatif serbaguna untuk ide dan post.',recommendation:'Serbaguna'},
  {id:'gpt-6-luna',name:'GPT-6 Luna',temperature:0.8,maxTokens:1000,strengths:['natural_id','creative'],bestFor:'Draft singkat dan penggunaan rutin yang lebih hemat.',recommendation:'Hemat untuk volume'}
 ]}};
export const DEFAULT_MODEL='gpt-6.1-sol';
export function getSelectedModel():string{try{const id=localStorage.getItem('postpilot_model');return PROVIDER_PRESETS.xingchi.models.some(m=>m.id===id)?id:DEFAULT_MODEL;}catch{return DEFAULT_MODEL;}}
export function setSelectedModel(id:string):void{if(PROVIDER_PRESETS.xingchi.models.some(m=>m.id===id)){try{localStorage.setItem('postpilot_model',id);}catch{}}}
export interface GenerateParams {provider:string;apiKey?:string;baseUrl?:string;model:string;prompt:string;maxTokens?:number;temperature?:number;}
export interface ModelOptimalParams {temperature:number;maxTokens:number;}
export function getModelParams(provider:string,model:string):ModelOptimalParams {const m=PROVIDER_PRESETS[provider]?.models.find(x=>x.id===model);return m?{temperature:m.temperature,maxTokens:m.maxTokens}:{temperature:0.85,maxTokens:1400};}
export function getModelProfile(provider:string,model:string):ModelConfig|null{return PROVIDER_PRESETS[provider]?.models.find(x=>x.id===model)||null;}
export async function callAI(params:GenerateParams):Promise<{content:string;provider:string;model:string}>{
 const response=await fetch('/.netlify/functions/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:params.prompt,model:params.model,max_tokens:params.maxTokens,temperature:params.temperature})});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`AI request failed (${response.status})`);
 return {content:data.content||'',provider:'OpenAI · Xingchi',model:data.model||params.model};
}
export async function testConnection(model=getSelectedModel()):Promise<{success:boolean;error?:string}>{try{const r=await fetch('/.netlify/functions/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Balas hanya dengan OK.',model,max_tokens:20,temperature:0})});const d=await r.json().catch(()=>({}));return r.ok&&!!d.content?{success:true}:{success:false,error:d.error||'Koneksi gagal'};}catch(e){return{success:false,error:e instanceof Error?e.message:'Koneksi gagal'};}}
