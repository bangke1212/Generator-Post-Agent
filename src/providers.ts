// Multi-provider AI — Vite client-side (no backend)
// X Algorithm 2026 — All-timeline coverage optimization

import OpenAI from 'openai';

export interface ModelConfig {
  id: string;
  name: string;
  free?: boolean;
  // Per-model optimal settings for X tweet generation
  temperature: number;
  maxTokens: number;
  // Model strength profile
  strengths: string[];   // e.g. ['natural_id', 'reasoning', 'creative']
  bestFor: string;       // e.g. 'debate', 'supportif', 'general'
}

export interface ProviderConfig {
  name: string;
  icon: string;
  baseUrl: string;
  docs?: string;
  models: ModelConfig[];
  // Provider-level defaults
  defaultSystemPrompt?: string;
  rateLimitNote?: string;
}

export const PROVIDER_PRESETS: Record<string, ProviderConfig> = {
  // ── OpenRouter (router gateway) ──────────────────────────
  openrouter: {
    name: 'OpenRouter',
    icon: '🔀',
    baseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/keys',
    rateLimitNote: 'Free models: ~20 req/min. Paid: unlimited.',
    models: [
      {
        id: 'google/gemini-2.0-flash-001',
        name: '🆓 Gemini 2.0 Flash (Best Free)',
        free: true,
        temperature: 0.88,
        maxTokens: 700,
        strengths: ['natural_id', 'emoji_rich', 'fast'],
        bestFor: 'general & supportif — paling natural untuk bahasa Indonesia',
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: '🆓 Llama 3.3 70B (Free)',
        free: true,
        temperature: 0.82,
        maxTokens: 650,
        strengths: ['structured', 'logical', 'debate'],
        bestFor: 'debate & konten analitis — reasoning kuat',
      },
      {
        id: 'deepseek/deepseek-r1-distill-llama-70b',
        name: '🆓 DeepSeek R1 70B (Free)',
        free: true,
        temperature: 0.78,
        maxTokens: 800,
        strengths: ['deep_reasoning', 'contrarian', 'technical'],
        bestFor: 'kritik-pedas & hot take — chain-of-thought reasoning',
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        name: '🆓 Mistral 7B (Free)',
        free: true,
        temperature: 0.85,
        maxTokens: 500,
        strengths: ['concise', 'punchy'],
        bestFor: 'quick takes & one-liner hooks',
      },
      {
        id: 'qwen/qwen-2.5-7b-instruct',
        name: '🆓 Qwen 2.5 7B (Free)',
        free: true,
        temperature: 0.8,
        maxTokens: 600,
        strengths: ['multilingual', 'balanced'],
        bestFor: 'ID/EN bilingual content',
      },
      {
        id: 'microsoft/phi-4',
        name: '🆓 Phi-4 (Free)',
        free: true,
        temperature: 0.75,
        maxTokens: 550,
        strengths: ['precise', 'safe'],
        bestFor: 'supportif & tips praktis',
      },
    ],
  },

  // ── OpenAI ───────────────────────────────────────────────
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    baseUrl: 'https://api.openai.com/v1',
    docs: 'https://platform.openai.com/api-keys',
    rateLimitNote: 'GPT-4o Mini: 3M TPM. GPT-4o: 30K TPM.',
    models: [
      {
        id: 'gpt-4o-mini',
        name: '💰 GPT-4o Mini (Murah)',
        temperature: 0.88,
        maxTokens: 700,
        strengths: ['creative', 'conversational', 'all_tone'],
        bestFor: 'semua tone — versatile, murah, cepat',
      },
      {
        id: 'gpt-3.5-turbo',
        name: '💰 GPT-3.5 Turbo (Termurah)',
        temperature: 0.85,
        maxTokens: 500,
        strengths: ['fast', 'simple'],
        bestFor: 'quick draft — jangan untuk tweet final',
      },
      {
        id: 'gpt-4o',
        name: '💎 GPT-4o (Premium)',
        temperature: 0.9,
        maxTokens: 900,
        strengths: ['nuanced', 'deep_reasoning', 'viral_patterns'],
        bestFor: 'tweet VIRAL premium — nuanced, subtle, smart humor',
      },
      {
        id: 'gpt-4.1-nano',
        name: '💎 GPT-4.1 Nano (Cheap Smart)',
        temperature: 0.87,
        maxTokens: 650,
        strengths: ['fast', 'smart', 'balanced'],
        bestFor: 'balancing quality & cost',
      },
    ],
  },

  // ── Gemini (Google AI Studio) ────────────────────────────
  gemini: {
    name: 'Gemini',
    icon: '💎',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    docs: 'https://aistudio.google.com/app/apikey',
    rateLimitNote: 'Free tier: 1500 req/day. Paid: 300 req/min.',
    models: [
      {
        id: 'gemini-2.0-flash',
        name: '🆓 Gemini 2.0 Flash (Free Tier)',
        free: true,
        temperature: 0.88,
        maxTokens: 800,
        strengths: ['natural_id', 'emoji_rich', 'trend_aware'],
        bestFor: 'Bahasa Indonesia natural + emoji — paling "gue banget"',
      },
      {
        id: 'gemini-1.5-flash',
        name: '🆓 Gemini 1.5 Flash (Free Tier)',
        free: true,
        temperature: 0.82,
        maxTokens: 650,
        strengths: ['balanced', 'safe', 'informational'],
        bestFor: 'supportif & tips — lebih aman dan informatif',
      },
      {
        id: 'gemini-2.5-pro',
        name: '💎 Gemini 2.5 Pro (Premium)',
        temperature: 0.92,
        maxTokens: 1000,
        strengths: ['deep_reasoning', 'creative', 'long_form'],
        bestFor: 'thread viral & deep analysis — 1M token context',
      },
    ],
  },

  // ── Groq (Fast Inference) ───────────────────────────────
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1',
    docs: 'https://console.groq.com/keys',
    rateLimitNote: 'Free tier: 30 req/min, 14K TPM.',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: '🆓 Llama 3.3 70B (Free)',
        free: true,
        temperature: 0.84,
        maxTokens: 650,
        strengths: ['structured', 'logical', 'debate'],
        bestFor: 'debate & contrarian take',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: '🆓 Llama 3.1 8B (Cepat)',
        free: true,
        temperature: 0.8,
        maxTokens: 450,
        strengths: ['ultra_fast', 'simple'],
        bestFor: 'quick draft — super cepat, kurang nuanced',
      },
      {
        id: 'gemma2-9b-it',
        name: '🆓 Gemma 2 9B (Free)',
        free: true,
        temperature: 0.83,
        maxTokens: 550,
        strengths: ['conversational', 'safe'],
        bestFor: 'supportif & relatable content',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: '🆓 Mixtral 8x7B (Free)',
        free: true,
        temperature: 0.86,
        maxTokens: 600,
        strengths: ['creative', 'multi_perspective'],
        bestFor: 'creative takes & multi-angle content',
      },
    ],
  },

  // ── Agnes AI ─────────────────────────────────────────────
  agnes: {
    name: 'Agnes AI',
    icon: '🦉',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    docs: 'https://platform.agnes-ai.com/settings/apiKeys',
    rateLimitNote: 'Free tier generous. Check platform for limits.',
    models: [
      {
        id: 'agnes-2.0-flash',
        name: '🆓 Agnes 2.0 Flash (Free)',
        free: true,
        temperature: 0.85,
        maxTokens: 650,
        strengths: ['balanced', 'conversational'],
        bestFor: 'general purpose tweet generation',
      },
      {
        id: 'agnes-2.0-pro',
        name: '🆓 Agnes 2.0 Pro (Free)',
        free: true,
        temperature: 0.9,
        maxTokens: 900,
        strengths: ['deep_reasoning', 'creative', 'viral_patterns'],
        bestFor: 'thread viral & premium content',
      },
      {
        id: 'agnes-1.5-flash',
        name: '🆓 Agnes 1.5 Flash (Free)',
        free: true,
        temperature: 0.8,
        maxTokens: 500,
        strengths: ['fast', 'simple'],
        bestFor: 'quick drafts & simple takes',
      },
      { id: 'agnes-image-2.0', name: '🆓 Agnes Image 2.0', temperature: 0, maxTokens: 0, strengths: ['image_gen'], bestFor: 'image generation only' },
    ],
  },

  // ── Custom API ───────────────────────────────────────────
  custom: {
    name: 'Custom API',
    icon: '🔧',
    baseUrl: '',
    models: [{
      id: 'custom-model',
      name: 'Custom Model',
      temperature: 0.85,
      maxTokens: 700,
      strengths: ['unknown'],
      bestFor: 'custom endpoint',
    }],
  },
};

// ============================================================
//  PER-MODEL PARAMETER RESOLVER
// ============================================================

export interface GenerateParams {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelOptimalParams {
  temperature: number;
  maxTokens: number;
}

/** Auto-resolve optimal temperature & maxTokens per provider+model */
export function getModelParams(provider: string, model: string): ModelOptimalParams {
  const preset = PROVIDER_PRESETS[provider];
  if (!preset) return { temperature: 0.85, maxTokens: 700 };
  const m = preset.models.find(x => x.id === model);
  if (m) return { temperature: m.temperature, maxTokens: m.maxTokens };
  return { temperature: 0.85, maxTokens: 700 };
}

/** Get model strength profile for hint injection */
export function getModelProfile(provider: string, model: string): ModelConfig | null {
  const preset = PROVIDER_PRESETS[provider];
  if (!preset) return null;
  return preset.models.find(x => x.id === model) || null;
}

// ============================================================
//  CORE AI CALLER — X Algorithm 2026
//  All-timeline system prompt engineered per model
// ============================================================

export async function callAI(params: GenerateParams): Promise<{ content: string; provider: string; model: string }> {
  const { provider, apiKey, baseUrl, model, prompt, maxTokens, temperature } = params;

  const preset = PROVIDER_PRESETS[provider];
  const url = baseUrl || preset?.baseUrl || 'https://api.openai.com/v1';

  // Resolve optimal params from model config
  const optimal = getModelParams(provider, model);

  const openai = new OpenAI({
    apiKey,
    baseURL: url,
    dangerouslyAllowBrowser: true,
  });

  const res = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens ?? optimal.maxTokens,
    temperature: temperature ?? optimal.temperature,
  });

  return {
    content: res.choices[0]?.message?.content || '',
    provider,
    model,
  };
}

export async function testConnection(params: Omit<GenerateParams, 'prompt' | 'maxTokens' | 'temperature'>): Promise<{ success: boolean; error?: string; model?: string }> {
  try {
    const res = await callAI({ ...params, prompt: 'Say "OK" only.', maxTokens: 5, temperature: 0 });
    if (res.content.trim()) return { success: true, model: params.model };
    return { success: false, error: 'Empty response' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Connection failed' };
  }
}
