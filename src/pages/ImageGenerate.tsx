import { useEffect, useState } from 'react';
import { getAllApiKeys } from '../store';

interface Props { onTabChange: (tab: string) => void; }
interface ImageModel { id: string; name?: string; free?: boolean; }
const PROMPT_MODEL_IDS = ['deepseek-v4-flash-uncensored:free', 'deepseek-v4.1-flash-uncensored:free'];

async function crowllmRequest(body: Record<string, unknown>) {
  const response = await fetch('/api/crowllm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  let payload: any;
  try { payload = JSON.parse(raw); }
  catch { throw new Error('Backend CrowLLM mengembalikan respons tidak valid (HTTP ' + response.status + '). Periksa deployment Vercel.'); }
  if (!response.ok) throw new Error(payload?.error?.message || 'CrowLLM gagal (HTTP ' + response.status + ').');
  return payload;
}

export default function ImageGenerate({ onTabChange }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<ImageModel[]>([]);
  const [model, setModel] = useState('');
  const [promptModels, setPromptModels] = useState<ImageModel[]>([]);
  const [promptModel, setPromptModel] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [loadingModels, setLoadingModels] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [resultModel, setResultModel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = getAllApiKeys().find(item => item.provider === 'crowllm');
    setApiKey(saved?.api_key || '');
  }, []);

  const loadModels = async () => {
    if (!apiKey) {
      setError('API Key CrowLLM belum tersimpan. Buka AI Providers, tambahkan CrowLLM, lalu simpan API key.');
      return;
    }
    setLoadingModels(true);
    setError('');
    try {
      const [catalog, chatCatalog] = await Promise.all([
        crowllmRequest({ action: 'image_models', apiKey }),
        crowllmRequest({ action: 'models', apiKey }),
      ]);
      const available = Array.isArray(catalog.models) ? catalog.models : [];
      const chatModels = Array.isArray(chatCatalog.models) ? chatCatalog.models : [];
      const availablePromptModels = PROMPT_MODEL_IDS
        .filter(id => chatModels.some((item: ImageModel) => item.id === id))
        .map(id => ({ id, name: id, free: true }));
      setPromptModels(availablePromptModels);
      setPromptModel(current => availablePromptModels.some((item: ImageModel) => item.id === current) ? current : (availablePromptModels[0]?.id || ''));
      setModels(available);
      setModel(current => available.some((item: ImageModel) => item.id === current) ? current : (available[0]?.id || ''));
      if (!available.length) setError('Tidak ada model dengan endpoint image generation yang terdeteksi pada katalog API key ini. Pastikan akun CrowLLM memiliki akses ke model Text-to-Image.');
    } catch (e: any) {
      setError(e.message || 'Gagal memuat model image CrowLLM.');
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (apiKey) void loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const enhancePrompt = async () => {
    if (!apiKey) { setError('API Key CrowLLM belum tersimpan. Buka AI Providers terlebih dahulu.'); return; }
    if (!promptModel) { setError('Tidak ada model DeepSeek prompt yang terdeteksi tersedia di katalog chat CrowLLM.'); return; }
    if (!prompt.trim()) { setError('Tulis ide gambar terlebih dahulu.'); return; }
    setEnhancing(true);
    setError('');
    try {
      const result = await crowllmRequest({ action: 'enhance_image_prompt', apiKey, model: promptModel, prompt });
      if (typeof result.prompt !== 'string' || !result.prompt.trim()) throw new Error('Model tidak menghasilkan prompt yang valid.');
      setPrompt(result.prompt.trim());
    } catch (e: any) {
      setError(e.message || 'Gagal menyusun prompt.');
    } finally {
      setEnhancing(false);
    }
  };

  const generate = async () => {
    if (!apiKey) { setError('API Key CrowLLM belum tersimpan. Buka AI Providers terlebih dahulu.'); return; }
    if (!model) { setError('Belum ada model Text-to-Image yang tersedia. Muat ulang katalog model.'); return; }
    if (!prompt.trim()) { setError('Masukkan deskripsi gambar terlebih dahulu.'); return; }
    setGenerating(true);
    setError('');
    setImageUrl('');
    setRevisedPrompt('');
    try {
      const payload = await crowllmRequest({ action: 'generate_image', apiKey, model, prompt, size });
      const image = Array.isArray(payload?.data) ? payload.data[0] : Array.isArray(payload?.images) ? payload.images[0] : null;
      if (typeof image?.b64_json === 'string' && image.b64_json) {
        setImageUrl('data:image/png;base64,' + image.b64_json);
      } else if (typeof image?.url === 'string' && image.url) {
        setImageUrl(image.url);
      } else {
        throw new Error('CrowLLM berhasil merespons, tetapi tidak mengirim URL atau data gambar yang dikenali.');
      }
      setRevisedPrompt(typeof image?.revised_prompt === 'string' ? image.revised_prompt : '');
      setResultModel(model);
    } catch (e: any) {
      setError(e.message || 'Gagal membuat gambar.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">🎨</span> Text to Image</h2>
          <p className="text-sm text-[#9aa7b8] mt-1">Buat gambar dari prompt menggunakan model image CrowLLM.</p>
        </div>
        <button onClick={() => onTabChange('settings')} className="btn-ghost text-sm">⚙ AI Providers</button>
      </div>

      <section className="card-glow space-y-4">
        {!apiKey && (
          <div className="rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3 text-sm text-[#fbbf24]">
            API Key CrowLLM belum ditemukan. Simpan API key CrowLLM di halaman AI Providers terlebih dahulu.
          </div>
        )}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider">Model gambar</label>
            <button type="button" onClick={loadModels} disabled={!apiKey || loadingModels} className="btn-outline text-xs py-2 px-3">
              {loadingModels ? 'Memuat katalog...' : '↻ Muat model'}
            </button>
          </div>
          <select value={model} onChange={event => setModel(event.target.value)} disabled={!models.length || loadingModels} className="input">
            {!models.length && <option value="">Belum ada model image</option>}
            {models.map(item => <option key={item.id} value={item.id}>{item.id}{item.free ? ' · Free' : ''}</option>)}
          </select>
          <p className="text-[11px] text-[#64748b] mt-2">Daftar hanya menampilkan model yang katalog CrowLLM tandai mendukung endpoint image generation. Model berbayar dapat menimbulkan biaya sesuai tarif akun.</p>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider block mb-2">Model penyusun prompt (DeepSeek)</label>
          <div className="flex gap-2">
            <select value={promptModel} onChange={event => setPromptModel(event.target.value)} disabled={!promptModels.length || loadingModels} className="input flex-1">
              {!promptModels.length && <option value="">Model DeepSeek belum tersedia</option>}
              {promptModels.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}
            </select>
            <button type="button" onClick={enhancePrompt} disabled={!promptModel || !prompt.trim() || enhancing || loadingModels} className="btn-outline text-xs px-3 whitespace-nowrap">
              {enhancing ? 'Menyusun...' : '✨ Perbaiki prompt'}
            </button>
          </div>
          <p className="text-[11px] text-[#64748b] mt-2">DeepSeek hanya menyusun prompt melalui endpoint chat. Model ini tidak digunakan untuk membuat file gambar.</p>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider block mb-2">Prompt gambar</label>
          <textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={5}
            placeholder="Contoh: A cinematic editorial photo of a futuristic Jakarta skyline at golden hour, ultra detailed, natural lighting..."
            className="input resize-y" />
        </div>

        <div className="max-w-xs">
          <label className="text-[11px] font-semibold text-[#9aa7b8] uppercase tracking-wider block mb-2">Ukuran gambar</label>
          <select value={size} onChange={event => setSize(event.target.value)} className="input">
            <option value="1024x1024">Persegi · 1024 × 1024</option>
            <option value="1024x1536">Portrait · 1024 × 1536</option>
            <option value="1536x1024">Landscape · 1536 × 1024</option>
          </select>
        </div>

        <button onClick={generate} disabled={generating || loadingModels || !model || !prompt.trim()} className="btn-primary w-full py-4 text-base">
          {generating ? '⏳ Membuat gambar...' : '✨ Generate Image'}
        </button>
      </section>

      {error && <div className="card border-[#ef4444]/30 bg-[#ef4444]/5"><p className="text-sm text-[#f87171] whitespace-pre-wrap">{error}</p></div>}

      {generating && <div className="card text-center py-12 space-y-3"><div className="text-4xl animate-pulse">🎨</div><p className="text-sm text-[#9aa7b8]">Model sedang membuat gambar. Proses ini bisa memerlukan waktu.</p></div>}

      {imageUrl && (
        <section className="card-glow space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div><h3 className="font-semibold">Hasil gambar</h3><p className="text-[11px] text-[#9aa7b8] mt-1">{resultModel}</p></div>
            <a href={imageUrl} download="crowllm-generated-image.png" target="_blank" rel="noreferrer" className="btn-outline text-xs">⬇ Buka / Simpan gambar</a>
          </div>
          <img src={imageUrl} alt="Hasil gambar dari CrowLLM" className="w-full max-h-[760px] object-contain rounded-xl border border-[#2c3b4e] bg-[#0d131c]" />
          {revisedPrompt && <p className="text-xs text-[#9aa7b8]">Prompt hasil revisi model: {revisedPrompt}</p>}
          <button onClick={generate} disabled={generating} className="btn-outline w-full">↻ Generate ulang</button>
        </section>
      )}
    </div>
  );
}
