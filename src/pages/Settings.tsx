import {useEffect,useState} from 'react';
import {testConnection} from '../providers';
type ServerConfig={aiConfigured:boolean;xConfigured:boolean;model:string;baseUrl:string};
export default function Settings(){
 const [config,setConfig]=useState<ServerConfig|null>(null),[loading,setLoading]=useState(true),[testing,setTesting]=useState(false),[test,setTest]=useState<{success:boolean;error?:string}|null>(null),[error,setError]=useState('');
 const refresh=async()=>{setLoading(true);setError('');try{const r=await fetch('/.netlify/functions/config');if(!r.ok)throw new Error('Konfigurasi server belum tersedia. Pastikan deploy menggunakan Netlify.');setConfig(await r.json());}catch(e){setError(e instanceof Error?e.message:'Gagal memuat konfigurasi');}finally{setLoading(false);}};
 useEffect(()=>{void refresh();},[]);
 const runTest=async()=>{setTesting(true);setTest(null);setTest(await testConnection());setTesting(false);};
 return <div className="space-y-6 animate-fade-in"><div><h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">🔐</span> Koneksi & Pengaturan</h2><p className="text-sm text-[#91a0b5] mt-1">API key dikelola di server Netlify, bukan disimpan di browser.</p></div>
 <section className="card-glow space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Xingchi AI Gateway</h3><span className="badge badge-info">Server-side</span></div>
 {loading?<p className="text-sm text-[#91a0b5]">Memeriksa konfigurasi…</p>:error?<p className="text-sm text-[#f87171]">{error}</p>:<div className="grid sm:grid-cols-2 gap-3">
 <div className="rounded-xl border border-[#263448] bg-[#0b121e] p-4"><p className="text-xs text-[#91a0b5]">API KEY</p><p className="mt-2 font-semibold">{config?.aiConfigured?'● Tersimpan di server':'○ Belum diatur'}</p></div>
 <div className="rounded-xl border border-[#263448] bg-[#0b121e] p-4"><p className="text-xs text-[#91a0b5]">MODEL AKTIF</p><p className="mt-2 font-semibold">{config?.model||'gpt-6.1-sol'}</p></div>
 <div className="rounded-xl border border-[#263448] bg-[#0b121e] p-4"><p className="text-xs text-[#91a0b5]">X / TWITTER PUBLISH</p><p className="mt-2 font-semibold">{config?.xConfigured?'● Token terpasang':'○ Belum diatur'}</p></div>
 <div className="rounded-xl border border-[#263448] bg-[#0b121e] p-4"><p className="text-xs text-[#91a0b5]">API BASE URL</p><p className="mt-2 text-xs break-all">{config?.baseUrl}</p></div></div>}
 <div className="flex flex-wrap gap-3"><button onClick={runTest} disabled={testing||!config?.aiConfigured} className="btn-primary">{testing?'Menguji…':'⚡ Test koneksi AI'}</button><button onClick={refresh} className="btn-outline">↻ Periksa ulang</button></div>
 {test&&<p className={test.success?'text-sm text-[#45d9c0]':'text-sm text-[#f87171]'}>{test.success?'✓ Xingchi API berhasil merespons.':test.error}</p>}</section>
 <section className="card space-y-3"><h3 className="font-semibold">Cara mengatur di Netlify</h3><ol className="list-decimal pl-5 space-y-2 text-sm text-[#aab6c7]">
 <li>Buka Netlify → Site configuration → Environment variables.</li><li>Tambahkan <code className="text-[#8f9aff]">XINGCHI_API_KEY</code> dengan API key baru dari dashboard Xingchi.</li><li>Tambahkan <code className="text-[#8f9aff]">XINGCHI_BASE_URL</code> = <code>https://api.xingchiapi.com/v1</code>.</li><li>Tambahkan <code className="text-[#8f9aff]">XINGCHI_MODEL</code> = <code>gpt-6.1-sol</code> (pastikan alias ini aktif di akun Xingchi).</li><li>Untuk publikasi langsung, tambahkan <code className="text-[#8f9aff]">X_USER_ACCESS_TOKEN</code> dari OAuth 2.0 User Context X dengan izin <code>tweet.write</code>.</li><li>Simpan variabel lalu redeploy.</li></ol>
 <p className="text-xs text-[#f2b96b]">Jangan masukkan API key ke form browser, file .env yang di-commit, atau source code. Gunakan key baru—key yang pernah dibagikan di chat sebaiknya dicabut.</p></section></div>;
}
