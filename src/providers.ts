// Multi-provider AI — Vite client-side (no backend)
// X Algorithm 2026 — All-timeline coverage optimization
// 7 Providers · 29+ Models

import OpenAI from 'openai';

export interface ModelConfig {
  id: string;
  name: string;
  free?: boolean;
  recommended?: boolean;
  temperature: number;
  maxTokens: number;
  strengths: string[];
  bestFor: string;
  status?: 'healthy' | 'degraded' | 'unstable' | 'unavailable' | 'no_data';
  successRate?: number | null;
  averageLatencyMs?: number | null;
  requests24h?: number | null;
}

export interface ProviderConfig {
  name: string;
  icon: string;
  baseUrl: string;
  docs?: string;
  models: ModelConfig[];
  defaultSystemPrompt?: string;
  rateLimitNote?: string;
}

export const CROWLLM_FREE_MODELS: ModelConfig[] = [
  { id: 'agnes-2.5-flash:free', name: 'Agnes 2.5 Flash', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'grok-4.7-fast:free', name: 'Grok 4.7 Fast', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat', 'fast', 'creative'], bestFor: 'Respons cepat dan kreatif.' },
  { id: 'gemini-3.8-flash:free', name: 'Gemini 3.8 Flash', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat', 'multilingual', 'vision'], bestFor: 'Chat, multilingual, dan analisis gambar.' },
  { id: 'qwen3-8-omni-flash:free', name: 'Qwen3 8 Omni Flash', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat', 'multilingual', 'multimodal'], bestFor: 'Chat cepat dan multilingual.' },
  { id: 'beam-1.0:free', name: 'Beam 1.0', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'caw/glm-5.3-flash:free', name: 'GLM 5.3 Flash', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'crouton-alpha:free', name: 'Crouton Alpha', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'crow-code-limitless:free', name: 'Crow Code Limitless', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat', 'coding'], bestFor: 'Coding dan chat.' },
  { id: 'crow-uncensored:free', name: 'Crow Uncensored Free', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat alternatif; tinjau hasil sebelum digunakan.' },
  { id: 'crow/auto:free', name: 'Crow Auto Free', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Router otomatis ke model free yang tersedia.' },
  { id: 'minimax-m3.1-flash:free', name: 'MiniMax M3.1 Flash', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'muse-spark-1.1:free', name: 'Muse Spark 1.1', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'nemotron-3.5-super-vl:free', name: 'NVIDIA Nemotron 3.5 Super VL', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat', 'vision', 'multimodal'], bestFor: 'Chat dan analisis gambar/video.' },
  { id: 'nvidia/nemotron-3.5-bolt-e4b:free', name: 'NVIDIA Nemotron 3.5 Bolt E4B', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat gratis pilihan.' },
  { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b:free', name: 'NVIDIA Nemotron 3.5 Super VL 120B A12B', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat', 'vision', 'multimodal'], bestFor: 'Analisis visual multimodal dengan model besar.' },
  { id: 'deepseek-v4.1-flash-uncensored:free', name: 'DeepSeek V4.1 Flash Uncensored', free: true, recommended: true, temperature: 0.82, maxTokens: 1400, strengths: ['chat'], bestFor: 'Model chat dengan output tanpa penyaring tertentu; tinjau hasilnya.' },
];

export interface CrowllmCatalogResult {
  models: ModelConfig[];
  partial: boolean;
  checkedCandidates: number;
  totalCandidates: number;
  timedOutModelPages: number;
}

export async function fetchCrowllmFreeModels(apiKey: string): Promise<CrowllmCatalogResult> {
  let response: Response;
  try {
    response = await fetch('/api/crowllm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'models', apiKey }),
    });
  } catch {
    throw new Error('Tidak dapat menghubungi backend Vercel (/api/crowllm). Pastikan deployment terbaru sudah selesai.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Backend CrowLLM gagal (HTTP ${response.status}).`);
  }
  if (!Array.isArray(payload?.models)) {
    throw new Error('Respons katalog CrowLLM tidak berisi daftar model yang valid.');
  }
  const models = payload.models
    .filter((item: any) => typeof item?.id === 'string' && item.free === true)
    .map((item: any): ModelConfig => {
      const recommended = CROWLLM_FREE_MODELS.find((candidate) => candidate.id === item.id);
      return {
        id: item.id,
        name: recommended ? `★ ${recommended.name}` : item.id,
        free: true,
        recommended: Boolean(recommended),
        temperature: recommended?.temperature ?? 0.82,
        maxTokens: recommended?.maxTokens ?? 1400,
        strengths: recommended?.strengths ?? ['chat'],
        bestFor: recommended?.bestFor ?? 'Model chat CrowLLM terverifikasi gratis.',
        status: item.status || 'no_data',
        successRate: typeof item.successRate === 'number' ? item.successRate : null,
        averageLatencyMs: typeof item.averageLatencyMs === 'number' ? item.averageLatencyMs : null,
        requests24h: typeof item.requests24h === 'number' ? item.requests24h : null,
      };
    })
    .sort((a: ModelConfig, b: ModelConfig) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)));
  return {
    models,
    partial: payload.partial === true,
    checkedCandidates: Number.isFinite(payload.checkedCandidates) ? payload.checkedCandidates : models.length,
    totalCandidates: Number.isFinite(payload.totalCandidates) ? payload.totalCandidates : models.length,
    timedOutModelPages: Number.isFinite(payload.timedOutModelPages) ? payload.timedOutModelPages : 0,
  };
}

export const PROVIDER_PRESETS: Record<string, ProviderConfig> = {
  openrouter: {
    name: 'OpenRouter',
    icon: '🔀',
    baseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/keys',
    rateLimitNote: '✅ GRATIS! 20 req/min free tier. No credit card.',
    models: [
      { id: 'google/gemini-2.0-flash-001', name: '🆓 Gemini 2.0 Flash ⭐', free: true, temperature: 0.88, maxTokens: 700, strengths: ['natural_id', 'emoji_rich', 'fast'], bestFor: '🏆 Best overall' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: '🆓 Llama 3.3 70B ⭐', free: true, temperature: 0.82, maxTokens: 650, strengths: ['structured', 'logical', 'debate'], bestFor: '🏆 Debate & Reasoning' },
      { id: 'deepseek/deepseek-r1-distill-llama-70b', name: '🆓 DeepSeek R1 70B ⭐', free: true, temperature: 0.78, maxTokens: 800, strengths: ['deep_reasoning', 'contrarian', 'technical'], bestFor: '🏆 Deep Analysis' },
      { id: 'mistralai/mistral-7b-instruct', name: '🆓 Mistral 7B', free: true, temperature: 0.85, maxTokens: 500, strengths: ['concise', 'punchy'], bestFor: 'Quick takes' },
      { id: 'qwen/qwen-2.5-7b-instruct', name: '🆓 Qwen 2.5 7B', free: true, temperature: 0.8, maxTokens: 600, strengths: ['multilingual', 'balanced'], bestFor: 'Bilingual content' },
      { id: 'microsoft/phi-4', name: '🆓 Phi-4', free: true, temperature: 0.75, maxTokens: 550, strengths: ['precise', 'safe'], bestFor: 'Safe & supportive' },
    ],
  },
  crowllm: {
    name: 'CrowLLM',
    icon: '🐦‍⬛',
    baseUrl: 'https://crowllm.com/v1',
    docs: 'https://crowllm.com/keys',
    rateLimitNote: 'Tier Free CrowLLM membatasi penggunaan hingga beberapa panggilan per menit; limit RPM khusus tiap model tidak dipublikasikan. Model yang terverifikasi untuk API key Anda disinkronkan dari GET /v1/models.',
    models: CROWLLM_FREE_MODELS,
  },
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    baseUrl: 'https://api.openai.com/v1',
    docs: 'https://platform.openai.com/api-keys',
    rateLimitNote: 'GPT-4o Mini: 3M TPM. GPT-4o: 30K TPM.',
    models: [
      { id: 'gpt-4o-mini', name: '💰 GPT-4o Mini', temperature: 0.88, maxTokens: 700, strengths: ['creative', 'conversational', 'all_tone'], bestFor: 'Versatile & cheap' },
      { id: 'gpt-3.5-turbo', name: '💰 GPT-3.5 Turbo', temperature: 0.85, maxTokens: 500, strengths: ['fast', 'simple'], bestFor: 'Quick draft' },
      { id: 'gpt-4o', name: '💎 GPT-4o', temperature: 0.9, maxTokens: 900, strengths: ['nuanced', 'deep_reasoning', 'viral_patterns'], bestFor: 'Premium viral' },
    ],
  },
  gemini: {
    name: 'Gemini',
    icon: '💎',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    docs: 'https://aistudio.google.com/app/apikey',
    rateLimitNote: '✅ GRATIS! 1500 req/day. No credit card.',
    models: [
      { id: 'gemini-2.0-flash', name: '🆓 Gemini 2.0 Flash ⭐', free: true, temperature: 0.88, maxTokens: 800, strengths: ['natural_id', 'emoji_rich', 'trend_aware'], bestFor: 'Indonesian native' },
      { id: 'gemini-1.5-flash', name: '🆓 Gemini 1.5 Flash', free: true, temperature: 0.82, maxTokens: 650, strengths: ['balanced', 'safe'], bestFor: 'Supportive tone' },
      { id: 'gemini-2.5-pro', name: '💎 Gemini 2.5 Pro', temperature: 0.92, maxTokens: 1000, strengths: ['deep_reasoning', 'creative'], bestFor: 'Viral threads' },
    ],
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1',
    docs: 'https://console.groq.com/keys',
    rateLimitNote: '✅ GRATIS! 30 req/min. No credit card.',
    models: [
      { id: 'llama-3.3-70b-versatile', name: '🆓 Llama 3.3 70B ⭐', free: true, temperature: 0.84, maxTokens: 650, strengths: ['structured', 'logical'], bestFor: 'Debate' },
      { id: 'llama-3.1-8b-instant', name: '🆓 Llama 3.1 8B', free: true, temperature: 0.8, maxTokens: 450, strengths: ['ultra_fast'], bestFor: 'Super fast' },
      { id: 'gemma2-9b-it', name: '🆓 Gemma 2 9B', free: true, temperature: 0.83, maxTokens: 550, strengths: ['conversational'], bestFor: 'Relatable' },
    ],
  },
  xingchi: {
    name: 'Xingchi AI',
    icon: '✦',
    baseUrl: 'https://api.xingchiapi.com/v1',
    docs: 'https://xingchiapi.com/dashboard',
    rateLimitNote: '⚠️ Kebijakan Xingchi: hanya klien pemrograman resmi (Codex, Claude Code, Hermes Agent, Cursor, Cline, dll.) yang diizinkan. Aplikasi web pihak ketiga seperti Generator Post Agent DITOLAK oleh server Xingchi (client_not_allowed) — tes koneksi provider ini akan selalu gagal dari aplikasi ini, apa pun key-nya. Gunakan Xingchi lewat Hermes Agent / Claude Code di VPS, atau pakai provider lain di aplikasi ini.',
    models: [
      { id: 'gpt-6-astra', name: 'GPT-6 Astra', temperature: 0.9, maxTokens: 1600, strengths: ['creative', 'natural_id', 'reasoning', 'deep_reasoning', 'debate'], bestFor: 'Hook kuat, ide orisinal, opini tajam, dan konten kompleks.' },
      { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol', temperature: 0.85, maxTokens: 1400, strengths: ['creative', 'natural_id', 'reasoning'], bestFor: 'Generator post harian dengan keseimbangan kualitas dan biaya.' },
      { id: 'gpt-6-sol', name: 'GPT-6 Sol', temperature: 0.85, maxTokens: 1400, strengths: ['creative', 'natural_id', 'reasoning'], bestFor: 'Alternatif serbaguna untuk ide dan post.' },
      { id: 'gpt-6-luna', name: 'GPT-6 Luna', temperature: 0.8, maxTokens: 1000, strengths: ['natural_id', 'creative'], bestFor: 'Draft singkat dan penggunaan rutin.' },
    ],
  },
  custom: {
    name: 'Custom API',
    icon: '🔧',
    baseUrl: '',
    models: [{ id: 'custom-model', name: 'Custom Model', temperature: 0.85, maxTokens: 700, strengths: ['unknown'], bestFor: 'Custom endpoint' }],
  },
};

export interface GenerateParams {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  prompt: string;
  imageData?: string;
  videoUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelOptimalParams {
  temperature: number;
  maxTokens: number;
}

export function getModelParams(provider: string, model: string): ModelOptimalParams {
  if (provider === 'crowllm') return { temperature: 0.82, maxTokens: 1400 };
  const preset = PROVIDER_PRESETS[provider];
  if (!preset) return { temperature: 0.85, maxTokens: 700 };
  const m = preset.models.find(x => x.id === model);
  if (m) return { temperature: m.temperature, maxTokens: m.maxTokens };
  return { temperature: 0.85, maxTokens: 700 };
}

export function getModelProfile(provider: string, model: string): ModelConfig | null {
  const preset = PROVIDER_PRESETS[provider];
  if (!preset) return null;
  return preset.models.find(x => x.id === model) || null;
}

async function resolveVideoForProvider(videoUrl: string, prompt: string): Promise<{ mediaUrl: string; mediaType: 'image' | 'video'; prompt: string }> {
  try {
    const response = await fetch('/api/crowllm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve_video', videoUrl }),
    });
    const payload = await response.json().catch(() => ({}));
    return {
      mediaUrl: typeof payload?.mediaUrl === 'string' && payload.mediaUrl ? payload.mediaUrl : videoUrl,
      mediaType: payload?.mediaType === 'image' ? 'image' : 'video',
      prompt: typeof payload?.text === 'string' && payload.text.trim()
        ? `${prompt}\n\nKONTEKS TEKS POST X: ${payload.text}`
        : prompt,
    };
  } catch {
    return { mediaUrl: videoUrl, mediaType: 'video', prompt };
  }
}

export async function callAI(params: GenerateParams): Promise<{ content: string; provider: string; model: string }> {
  const { provider, apiKey, baseUrl, model, prompt, imageData, videoUrl, maxTokens, temperature } = params;

  const preset = PROVIDER_PRESETS[provider];
  if (!preset) throw new Error('Provider ' + provider + ' tidak dikenal');

  const endpoint = baseUrl || preset.baseUrl;
  if (!endpoint) throw new Error('Base URL tidak diatur untuk ' + provider);

  const optimal = getModelParams(provider, model);
  const resolved = videoUrl ? await resolveVideoForProvider(videoUrl, prompt) : { mediaUrl: '', mediaType: 'video' as const, prompt };

  // CrowLLM is called through a same-origin Vercel function to avoid browser CORS failures.
  if (provider === 'crowllm') {
    let response: Response;
    try {
      response = await fetch('/api/crowllm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          apiKey,
          model,
          prompt: resolved.prompt,
          imageData,
          videoUrl: resolved.mediaUrl,
          mediaType: resolved.mediaType,
          maxTokens: maxTokens || optimal.maxTokens,
          temperature: temperature ?? optimal.temperature,
        }),
      });
    } catch {
      throw new Error('Tidak dapat menghubungi backend Vercel (/api/crowllm). Pastikan deployment terbaru sudah selesai.');
    }
    const raw = await response.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Backend CrowLLM mengembalikan respons tidak valid (HTTP ' + response.status + '). Periksa deployment fungsi Vercel.');
    }
    if (!response.ok) {
      const detail = data?.error?.message || 'CrowLLM API gagal (HTTP ' + response.status + ')';
      throw new Error(detail);
    }
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('CrowLLM merespons tanpa teks. Periksa model dan format respons API.');
    }
    return { content, provider: preset.name, model };
  }

  // Xingchi is called through a same-origin Vercel function to avoid browser CORS failures.
  if (provider === 'xingchi') {
    let response: Response;
    try {
      response = await fetch('/api/xingchi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model,
          prompt: resolved.prompt,
          videoUrl: resolved.mediaUrl,
          mediaType: resolved.mediaType,
          maxTokens: maxTokens || optimal.maxTokens,
          temperature: temperature ?? optimal.temperature,
        }),
      });
    } catch {
      throw new Error('Tidak dapat menghubungi backend Vercel (/api/xingchi). Pastikan deployment terbaru sudah selesai.');
    }

    const raw = await response.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Backend Xingchi mengembalikan respons tidak valid (HTTP ' + response.status + '). Periksa deployment fungsi Vercel.');
    }
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Xingchi API gagal (HTTP ' + response.status + ')');
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Xingchi merespons tanpa teks. Periksa model dan format respons API.');
    }
    return { content, provider: preset.name, model };
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: endpoint,
    dangerouslyAllowBrowser: true,
  });

  const messageContent: any = imageData || resolved.mediaUrl
    ? [
        ...(imageData ? [{ type: 'image_url', image_url: { url: imageData } }] : []),
        ...(resolved.mediaUrl ? [resolved.mediaType === 'image' ? { type: 'image_url', image_url: { url: resolved.mediaUrl } } : { type: 'video_url', video_url: { url: resolved.mediaUrl } }] : []),
        { type: 'text', text: resolved.prompt },
      ]
    : resolved.prompt;

  const res = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: messageContent }],
    max_tokens: maxTokens || optimal.maxTokens,
    temperature: temperature ?? optimal.temperature,
  });

  return {
    content: res.choices[0]?.message?.content || '',
    provider: preset.name,
    model,
  };
}

export async function testConnection(params: { provider: string; apiKey: string; model: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callAI({
      ...params,
      prompt: params.provider === 'crowllm' ? 'Reply with the single word: ready.' : 'Test koneksi — reply dengan OK saja',
    });
    return { success: !!result.content, error: result.content ? undefined : 'No response' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Connection failed' };
  }
}
