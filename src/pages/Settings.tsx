import { useEffect, useState } from 'react';
import { getAllApiKeys, saveApiKey, deleteApiKey, ApiKey } from '../store';
import { PROVIDER_PRESETS, testConnection } from '../providers';

export default function Settings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);

  const refresh = () => setKeys(getAllApiKeys());
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const preset = (PROVIDER_PRESETS as any)[provider];
    if (preset) setModel(preset.models[0]?.id || '');
  }, [provider]);

  const showToast = (type: string, text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) { showToast('error', 'API Key tidak boleh kosong'); return; }
    setSaving(true);
    saveApiKey({ provider, api_key: apiKey.trim(), model, is_active: true });
    showToast('success', `${(PROVIDER_PRESETS as any)[provider]?.name || provider} tersimpan & aktif!`);
    setApiKey('');
    refresh();
    setSaving(false);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) { showToast('error', 'Masukkan API Key dulu'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection({ provider, apiKey: apiKey.trim(), model });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally { setTesting(false); }
  };

  const handleDelete = (p: string) => {
    if (!confirm(`Hapus key ${(PROVIDER_PRESETS as any)[p]?.name || p}?`)) return;
    deleteApiKey(p);
    refresh();
    showToast('info', 'API Key dihapus');
  };

  const handleActivate = (p: string) => {
    const k = keys.find(k => k.provider === p);
    if (k) { saveApiKey({ ...k, is_active: true }); refresh(); showToast('success', 'Diaktifkan!'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}

      <div><h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">🔑</span> API Keys & Provider</h2><p className="text-sm text-[#666680] mt-1">Kelola API key dari berbagai provider</p></div>

      {keys.length > 0 && (
        <div className="card-glow space-y-3 animate-fade-in-up">
          <h3 className="text-sm font-semibold">Keys Tersimpan <span className="badge badge-default text-[10px] ml-2">{keys.length}</span></h3>
          <div className="grid gap-2">
            {keys.map(k => {
              const p = (PROVIDER_PRESETS as any)[k.provider];
              return (
                <div key={k.provider} className={`flex items-center justify-between p-4 rounded-2xl border ${k.is_active ? 'border-[#06b6d4]/30 bg-[#06b6d4]/5' : 'border-[#1e1e4a] bg-[#0d0d25]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[#ffffff05]">{p?.icon || '🔧'}</div>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {p?.name || k.provider}
                        {k.is_active && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06b6d4] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#06b6d4]"></span></span>}
                      </p>
                      <p className="text-xs text-[#666680] mt-0.5">{k.model?.split('/').pop() || '—'} · {k.api_key.slice(0,4)}****{k.api_key.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!k.is_active && <button onClick={() => handleActivate(k.provider)} className="btn-ghost text-xs text-[#06b6d4]">Aktifkan</button>}
                    <button onClick={() => handleDelete(k.provider)} className="btn-ghost text-xs text-[#ef4444]">🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-glow space-y-5">
        <h3 className="text-sm font-semibold">Tambah / Edit API Key</h3>

        <div>
          <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(PROVIDER_PRESETS).map(([slug, info]: any) => (
              <button key={slug} onClick={() => setProvider(slug)} className={`p-3 rounded-2xl border text-center ${provider === slug ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-[#1e1e4a] hover:border-[#2e2e5e]'}`}>
                <span className="text-xl block mb-1.5">{info.icon}</span><span className="text-[11px] font-medium text-[#9494b8]">{info.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} className="input">
            {((PROVIDER_PRESETS as any)[provider]?.models || []).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder={`${(PROVIDER_PRESETS as any)[provider]?.name || ''} API Key...`} className="input font-mono text-sm" />
          {(PROVIDER_PRESETS as any)[provider]?.docs && (
            <a href={(PROVIDER_PRESETS as any)[provider].docs} target="_blank" rel="noopener"
              className="text-xs text-[#6366f1] hover:text-[#818cf8] mt-2 inline-flex items-center gap-1">📖 Dapatkan API Key →</a>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : '💾 Simpan & Aktifkan'}</button>
          <button onClick={handleTest} disabled={testing} className="btn-outline text-sm">{testing ? 'Testing...' : '🧪 Test Koneksi'}</button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-2xl border animate-scale-in ${testResult.success ? 'bg-[#10b981]/5 border-[#10b981]/20' : 'bg-[#ef4444]/5 border-[#ef4444]/20'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
              <div><p className={`text-sm font-semibold ${testResult.success ? 'text-[#34d399]' : 'text-[#f87171]'}`}>{testResult.success ? 'Koneksi berhasil!' : 'Koneksi gagal'}</p>
              {testResult.error && <p className="text-xs text-[#f87171]/70 mt-1">{testResult.error}</p>}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
