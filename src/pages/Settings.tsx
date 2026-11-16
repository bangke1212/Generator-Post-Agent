import { useEffect, useState } from 'react';
import { getAllApiKeys, saveApiKey, deleteApiKey, ApiKey, getActiveApiKey } from '../store';
import { PROVIDER_PRESETS, CROWLLM_FREE_MODELS, getModelProfile, testConnection, fetchCrowllmFreeModels, ModelConfig } from '../providers';

export default function Settings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [toast, setToast] = useState<{ type: string; text: string } | null>(null);
  const [crowllmModels, setCrowllmModels] = useState<ModelConfig[]>([]);
  const [crowllmSynced, setCrowllmSynced] = useState(false);
  const [syncingModels, setSyncingModels] = useState(false);
  const [modelSyncMessage, setModelSyncMessage] = useState('');

  const refresh = () => setKeys(getAllApiKeys());
  useEffect(() => { refresh(); }, []);

  // Set default provider & model on mount
  useEffect(() => {
    const active = getActiveApiKey();
    if (active) {
      setProvider(active.provider);
      setModel(active.model);
    } else {
      const preset = (PROVIDER_PRESETS as any)[provider];
      if (preset) setModel(preset.models[0]?.id || '');
    }
  }, []);

  // When provider changes:
  // - If key already saved for this provider → auto-fill apiKey & use saved model
  // - If not saved → clear apiKey, default to first model
  useEffect(() => {
    const existingKey = keys.find(k => k.provider === provider);
    if (existingKey) {
      setApiKey(existingKey.api_key);
      setModel(existingKey.model);
    } else {
      setApiKey('');
      const preset = (PROVIDER_PRESETS as any)[provider];
      if (preset) setModel(preset.models[0]?.id || '');
    }
  }, [provider, keys]);

  const showToast = (type: string, text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) { showToast('error', 'API Key tidak boleh kosong'); return; }
    if (!model) { showToast('error', 'Pilih model yang tersedia terlebih dahulu'); return; }
    setSaving(true);
    saveApiKey({ provider, api_key: apiKey.trim(), model, is_active: true });
    showToast('success', `${(PROVIDER_PRESETS as any)[provider]?.name || provider} — ${model.split('/').pop()} tersimpan & aktif!`);
    refresh();
    setSaving(false);
  };

  // Update model only — keep existing API key, just change active model
  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    const existingKey = keys.find(k => k.provider === provider);
    if (existingKey) {
      // Auto-save model change if key already exists (no need to re-enter key)
      saveApiKey({ ...existingKey, model: newModel, is_active: true });
      refresh();
      showToast('success', `Model diganti ke ${newModel.split('/').pop()} — tetap aktif!`);
    }
  };

  const handleSyncCrowllmModels = async () => {
    const keyToUse = apiKey.trim() || keys.find(k => k.provider === 'crowllm')?.api_key || '';
    if (!keyToUse) { showToast('error', 'Masukkan API Key CrowLLM dulu'); return; }
    setSyncingModels(true);
    // Keep the last successful catalogue visible while refreshing; replace it only after success.
    setModelSyncMessage('Memperbarui katalog CrowLLM...');
    try {
      const catalog = await fetchCrowllmFreeModels(keyToUse);
      const models = catalog.models;
      const catalogNotes = [
        catalog.partial ? `Katalog besar: ${catalog.checkedCandidates} dari ${catalog.totalCandidates} kandidat diperiksa untuk menghindari timeout.` : '',
        catalog.timedOutModelPages ? `${catalog.timedOutModelPages} halaman model lambat dilewati; sinkronkan ulang untuk mencoba lagi.` : '',
      ].filter(Boolean).join(' ');
      setCrowllmModels(models);
      setCrowllmSynced(models.length > 0);
      if (models.length > 0) {
        setModel(models.some(item => item.id === model) ? model : models[0].id);
        setModelSyncMessage(`${models.length} model gratis chat terverifikasi tersedia untuk API key ini. Status dan latency diambil dari CrowLLM. ${catalogNotes}`.trim());
        showToast('success', `${models.length} model gratis CrowLLM berhasil disinkronkan.`);
      } else {
        setModel(CROWLLM_FREE_MODELS[0]?.id || '');
        setModelSyncMessage(`Belum ada model gratis yang berhasil diverifikasi untuk API key ini. Kandidat tetap ditampilkan sebagai pilihan awal, tetapi belum bisa dipakai. ${catalogNotes} Periksa key, scope, atau coba sinkronkan lagi.`.trim());
      }
    } catch (e: any) {
      setModelSyncMessage(`Katalog opsional tidak tersedia: ${e.message || 'gagal mengambil daftar model CrowLLM.'} Anda tetap dapat menyimpan model dan memvalidasinya lewat Test Koneksi.`);
    } finally {
      setSyncingModels(false);
    }
  };

  const handleTest = async () => {
    const keyToTest = apiKey.trim() || keys.find(k => k.provider === provider)?.api_key || '';
    if (!keyToTest) { showToast('error', 'Masukkan API Key dulu'); return; }
    if (!model) { showToast('error', 'Pilih model yang tersedia terlebih dahulu'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection({ provider, apiKey: keyToTest, model });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    } finally { setTesting(false); }
  };

  const handleDelete = (p: string) => {
    if (!confirm(`Hapus key ${(PROVIDER_PRESETS as any)[p]?.name || p}?`)) return;
    deleteApiKey(p);
    // If the deleted key was for the currently selected provider, clear the apiKey field
    if (p === provider) {
      setApiKey('');
      const preset = (PROVIDER_PRESETS as any)[provider];
      if (preset) setModel(preset.models[0]?.id || '');
    }
    refresh();
    showToast('info', 'API Key dihapus');
  };

  const handleActivate = (p: string) => {
    const k = keys.find(k => k.provider === p);
    if (k) { saveApiKey({ ...k, is_active: true }); refresh(); showToast('success', 'Diaktifkan!'); }
  };

  // Current model info for tooltip
  const modelProfile = provider === 'crowllm'
    ? crowllmModels.find(item => item.id === model) || CROWLLM_FREE_MODELS.find(item => item.id === model) || null
    : getModelProfile(provider, model);
  const presetModels = (PROVIDER_PRESETS as any)[provider]?.models || [];
  const modelOptions: ModelConfig[] = provider === 'crowllm'
    ? (crowllmSynced ? crowllmModels : CROWLLM_FREE_MODELS)
    : presetModels;
  const crowllmStatusLabels: Record<string, string> = {
    healthy: 'Stabil',
    degraded: 'Menurun',
    unstable: 'Bermasalah',
    unavailable: 'Tidak tersedia',
    no_data: 'Belum ada data',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">🔑</span> API Keys & Provider</h2>
        <p className="text-sm text-[#64748b] mt-1">Multi-provider AI — optimized X Algorithm 2026</p>
      </div>

      {keys.length > 0 && (
        <div className="card-glow space-y-3 animate-fade-in-up">
          <h3 className="text-sm font-semibold">Keys Tersimpan <span className="badge badge-default text-[10px] ml-2">{keys.length}</span></h3>
          <div className="grid gap-2">
            {keys.map(k => {
              const p = (PROVIDER_PRESETS as any)[k.provider];
              return (
                <div key={k.provider} className={`flex items-center justify-between p-4 rounded-2xl border ${k.is_active ? 'border-[#2dd4a7]/30 bg-[#2dd4a7]/5' : 'border-[#1e2937] bg-[#0d131c]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[#ffffff05]">{p?.icon || '🔧'}</div>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {p?.name || k.provider}
                        {k.is_active && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4a7] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#2dd4a7]"></span></span>}
                      </p>
                      <p className="text-xs text-[#64748b] mt-0.5">{k.model?.split('/').pop() || '—'} · {k.api_key.slice(0,4)}****{k.api_key.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!k.is_active && <button onClick={() => handleActivate(k.provider)} className="btn-ghost text-xs text-[#2dd4a7]">Aktifkan</button>}
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
          <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider mb-2.5 block">Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(PROVIDER_PRESETS).filter(([slug]) => slug !== 'custom').map(([slug, info]: any) => {
              const hasKey = keys.some(k => k.provider === slug);
              return (
                <button key={slug} onClick={() => setProvider(slug)} className={`p-3 rounded-2xl border text-center relative ${provider === slug ? 'border-[#2dd4a7] bg-[#2dd4a7]/10' : 'border-[#1e2937] hover:border-[#2c3b4e]'}`}>
                  {hasKey && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#10b981]"></span>}
                  <span className="text-xl block mb-1.5">{info.icon}</span><span className="text-[11px] font-medium text-[#9aa7b8]">{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider mb-2.5 block">Model</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={model} onChange={e => handleModelChange(e.target.value)} className="input flex-1" disabled={modelOptions.length === 0}>
              {model && !modelOptions.some(item => item.id === model) && (
                <option value={model}>{model} · perlu sinkronisasi</option>
              )}
              {modelOptions.map((m: ModelConfig) => (
                <option key={m.id} value={m.id}>{m.recommended ? `★ ${m.id} · rekomendasi` : m.name}</option>
              ))}
            </select>
            {provider === 'crowllm' && (
              <button onClick={handleSyncCrowllmModels} disabled={syncingModels} className="btn-outline text-xs whitespace-nowrap">
                {syncingModels ? 'Memuat...' : '↻ Muat katalog (opsional)'}
              </button>
            )}
          </div>
          {provider === 'crowllm' && (
            <div>
            <p className="text-xs text-[#64748b] mt-2">
              {crowllmSynced
                ? 'Daftar model tambahan berasal dari /v1/models. Katalog ini opsional; Test Koneksi memvalidasi model langsung melalui endpoint chat.'
                : `${CROWLLM_FREE_MODELS.length} model rekomendasi ditampilkan sebagai kandidat awal. Anda dapat langsung menyimpan dan menguji model dengan API key melalui Test Koneksi.`}{' '}
              Tier Free memiliki batas umum beberapa panggilan per menit; CrowLLM tidak mencantumkan RPM khusus per model.{' '}
              <a href="https://crowllm.com/status" target="_blank" rel="noopener noreferrer" className="text-[#2dd4a7] hover:text-[#5ee6c0]">Lihat status live CrowLLM</a>.
              {modelSyncMessage && <span className="block mt-1 text-[#9aa7b8]">{modelSyncMessage}</span>}
            </p>
            {crowllmSynced && (
              <div className="mt-3 rounded-xl border border-[#2c3b4e] bg-[#0d131c] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9aa7b8]">Status model · 24 jam</span>
                  <span className="text-[10px] text-[#64748b]">Data CrowLLM</span>
                </div>
                {crowllmModels.map(item => {
                  const status = item.status || 'no_data';
                  const statusColor = status === 'healthy' ? 'text-[#34d399]' : status === 'degraded' ? 'text-[#fbbf24]' : status === 'unstable' || status === 'unavailable' ? 'text-[#f87171]' : 'text-[#9aa7b8]';
                  const latency = item.averageLatencyMs == null ? 'Latency —' : item.averageLatencyMs >= 1000 ? `Latency ${(item.averageLatencyMs / 1000).toFixed(1)} dtk` : `Latency ${Math.round(item.averageLatencyMs)} ms`;
                  return (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#1e2937] pt-2 first:border-0 first:pt-0">
                      <span className="min-w-0 flex-1 break-all text-[11px] text-[#d7dee8]">{item.id}</span>
                      <span className={`text-[10px] font-semibold ${statusColor}`}>{crowllmStatusLabels[status]}</span>
                      <span className="text-[10px] text-[#9aa7b8]">{item.successRate == null ? 'Success —' : `Success ${item.successRate.toFixed(1)}%`}</span>
                      <span className="text-[10px] text-[#9aa7b8]">{latency}</span>
                    </div>
                  );
                })}
                {crowllmModels.length === 0 && <p className="text-xs text-[#fbbf24]">Tidak ada model gratis yang lolos verifikasi endpoint chat.</p>}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Model Info Card */}
        {modelProfile && (
          <div className="p-4 rounded-2xl border border-[#1e2937] bg-[#0d131c] space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="badge badge-accent text-[10px]">Best for</span>
              <span className="text-[#d7dee8]">{modelProfile.bestFor}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="badge badge-info text-[10px] shrink-0 mt-0.5">Strengths</span>
              <span className="text-[#9aa7b8]">{modelProfile.strengths?.join(' · ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-default text-[10px]">Temp</span>
              <span className="text-[#9aa7b8]">{modelProfile.temperature}</span>
              <span className="badge badge-default text-[10px] ml-3">Tokens</span>
              <span className="text-[#9aa7b8]">{modelProfile.maxTokens}</span>
            </div>
            {(PROVIDER_PRESETS as any)[provider]?.rateLimitNote && (
              <p className="text-[#64748b] italic">{(PROVIDER_PRESETS as any)[provider].rateLimitNote}</p>
            )}
          </div>
        )}

        <div>
          <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider mb-2.5 block">API Key</label>
          <input type="password" value={apiKey} onChange={e => {
            setApiKey(e.target.value);
            if (provider === 'crowllm') {
              setCrowllmSynced(false);
              setCrowllmModels([]);
              setModelSyncMessage('');
              if (!CROWLLM_FREE_MODELS.some(item => item.id === model)) setModel(CROWLLM_FREE_MODELS[0]?.id || '');
            }
          }}
            placeholder={`${(PROVIDER_PRESETS as any)[provider]?.name || ''} API Key...`} className="input font-mono text-sm" />
          {(PROVIDER_PRESETS as any)[provider]?.docs && (
            <a href={(PROVIDER_PRESETS as any)[provider].docs} target="_blank" rel="noopener"
              className="text-xs text-[#2dd4a7] hover:text-[#5ee6c0] mt-2 inline-flex items-center gap-1">📖 Dapatkan API Key →</a>
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
