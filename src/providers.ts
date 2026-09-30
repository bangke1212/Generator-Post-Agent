// Multi-provider AI — Vite client-side (no backend)
// X Algorithm 2026 — All-timeline coverage optimization
// 7 Providers · 29+ Models

import OpenAI from 'openai';

export interface ModelConfig {
  id: string;
  name: string;
  free?: boolean;
  temperature: number;
  maxTokens: number;
  strengths: string[];
  bestFor: string;
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

export const PROVIDER_PRESETS: Record<string, ProviderConfig> = {
  // ── OpenRouter — GRATIS ──────────────────────────────
  openrouter: {
    name: 'OpenRouter',
    icon: '🔀',
    baseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/keys',
    rateLimitNote: '✅ GRATIS! 20 req/min free tier. No credit card.',
    models: [
      { id: 'google/gemini-2.0-flash-001', name: '🆓 Gemini 2.0 Flash ⭐', free: true, temperature: 0.88, maxTokens: 700, strengths: ['natural_id', 'emoji_rich', 'fast'], bestFor: '🏆 BEST OVERALL — natural ID + emoji kreatif' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: '🆓 Llama 3.3 70B ⭐', free: true, temperature: 0.82, maxTokens: 650, strengths: ['structured', 'logical', 'debate'], bestFor: '🏆 DEBATE & ANALISIS — reasoning kuat' },
      { id: 'deepseek/deepseek-r1-distill-llama-70b', name: '🆓 DeepSeek R1 70B ⭐', free: true, temperature: 0.78, maxTokens: 800, strengths: ['deep_reasoning', 'contrarian', 'technical'], bestFor: '🏆 KRITIK PEDAS — chain-of-thought reasoning' },
      { id: 'mistralai/mistral-7b-instruct', name: '🆓 Mistral 7B', free: true, temperature: 0.85, maxTokens: 500, strengths: ['concise', 'punchy'], bestFor: 'quick takes & one-liner hooks' },
      { id: 'qwen/qwen-2.5-7b-instruct', name: '🆓 Qwen 2.5 7B', free: true, temperature: 0.8, maxTokens: 600, strengths: ['multilingual', 'balanced'], bestFor: 'ID/EN bilingual content' },
      { id: 'microsoft/phi-4', name: '🆓 Phi-4', free: true, temperature: 0.75, maxTokens: 550, strengths: ['precise', 'safe'], bestFor: 'supportif & tips praktis' },
      { id: 'qwen/qwen-3.8-27b-uncensored', name: '🔥 Qwen 3.8 27B Uncensored ⭐', free: true, temperature: 0.9, maxTokens: 900, strengths: ['unfiltered', 'raw', 'creative', 'edge'], bestFor: '🏆 KRITIK PEDAS & UNFILTERED — tanpa filter keamanan, opini raw' },
      { id: 'qwen/qwen3.6-27b-uncensored', name: '🔥 Qwen 3.6 27B Uncensored ⭐', free: true, temperature: 0.9, maxTokens: 850, strengths: ['unfiltered', 'high_quality', 'creative', 'edge'], bestFor: '🏆 HIGH-QUALITY UNCENSORED — Q6_K_P quant, lebih tajam & kreatif' },
      { id: 'qwen/qwen3.6-35b-moe', name: '🔥 Qwen 3.6 35B MoE ⭐', free: true, temperature: 0.88, maxTokens: 1000, strengths: ['deep_reasoning', 'creative', 'moE', 'uncensored'], bestFor: '🏆 MOE POWER — ~3B active params, uncensored & efficient' },
    
    ],
  },

  // ── OpenAI ───────────────────────────────────────────
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    baseUrl: 'https://api.openai.com/v1',
    docs: 'https://platform.openai.com/api-keys',
    rateLimitNote: 'GPT-4o Mini: 3M TPM. GPT-4o: 30K TPM.',
    models: [
      { id: 'gpt-4o-mini', name: '💰 GPT-4o Mini', temperature: 0.88, maxTokens: 700, strengths: ['creative', 'conversational', 'all_tone'], bestFor: 'semua tone — versatile, murah, cepat' },
      { id: 'gpt-3.5-turbo', name: '💰 GPT-3.5 Turbo', temperature: 0.85, maxTokens: 500, strengths: ['fast', 'simple'], bestFor: 'quick draft only' },
      { id: 'gpt-4o', name: '💎 GPT-4o (Premium)', temperature: 0.9, maxTokens: 900, strengths: ['nuanced', 'deep_reasoning', 'viral_patterns'], bestFor: 'tweet VIRAL premium — nuanced, smart' },
      { id: 'gpt-4.1-nano', name: '💎 GPT-4.1 Nano', temperature: 0.87, maxTokens: 650, strengths: ['fast', 'smart', 'balanced'], bestFor: 'balancing quality & cost' },
    ],
  },

  // ── Gemini ───────────────────────────────────────────
  gemini: {
    name: 'Gemini',
    icon: '💎',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    docs: 'https://aistudio.google.com/app/apikey',
    rateLimitNote: '✅ GRATIS! 1500 req/day. No credit card.',
    models: [
      { id: 'gemini-2.0-flash', name: '🆓 Gemini 2.0 Flash ⭐', free: true, temperature: 0.88, maxTokens: 800, strengths: ['natural_id', 'emoji_rich', 'trend_aware'], bestFor: '🏆 BAHASA INDONESIA — paling natural' },
      { id: 'gemini-1.5-flash', name: '🆓 Gemini 1.5 Flash', free: true, temperature: 0.82, maxTokens: 650, strengths: ['balanced', 'safe', 'informational'], bestFor: 'supportif & tips' },
      { id: 'gemini-2.5-pro', name: '💎 Gemini 2.5 Pro', temperature: 0.92, maxTokens: 1000, strengths: ['deep_reasoning', 'creative', 'long_form'], bestFor: 'thread viral & deep analysis' },
    ],
  },

  // ── Groq ─────────────────────────────────────────────
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1',
    docs: 'https://console.groq.com/keys',
    rateLimitNote: '✅ GRATIS! 30 req/min. No credit card.',
    models: [
      { id: 'llama-3.3-70b-versatile', name: '🆓 Llama 3.3 70B ⭐', free: true, temperature: 0.84, maxTokens: 650, strengths: ['structured', 'logical', 'debate'], bestFor: '🏆 DEBATE & CONTRARIAN' },
      { id: 'llama-3.1-8b-instant', name: '🆓 Llama 3.1 8B', free: true, temperature: 0.8, maxTokens: 450, strengths: ['ultra_fast', 'simple'], bestFor: 'quick draft — super cepat' },
      { id: 'gemma2-9b-it', name: '🆓 Gemma 2 9B', free: true, temperature: 0.83, maxTokens: 550, strengths: ['conversational', 'safe'], bestFor: 'supportif & relatable' },
      { id: 'mixtral-8x7b-32768', name: '🆓 Mixtral 8x7B', free: true, temperature: 0.86, maxTokens: 600, strengths: ['creative', 'multi_perspective'], bestFor: 'creative & multi-angle' },
    ],
  },

  // ── Agnes AI — FREE multimoda ────────────────────────
  agnes: {
    name: 'Agnes AI',
    icon: '🌟',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    docs: 'https://platform.agnes-ai.com/settings/apiKeys',
    rateLimitNote: '✅ GRATIS! Full multimodal free tier. 20 RPM.',
    models: [
      { id: 'agnes-2.0-flash', name: '🆓 Agnes 2.0 Flash ⭐', free: true, temperature: 0.85, maxTokens: 700, strengths: ['natural_id', 'creative', 'balanced'], bestFor: '🏆 ALL-ROUND — natural, versatile, cepat' },
      { id: 'agnes-2.0-pro', name: '🆓 Agnes 2.0 Pro ⭐', free: true, temperature: 0.9, maxTokens: 900, strengths: ['deep_reasoning', 'creative', 'viral_patterns'], bestFor: '🏆 VIRAL THREAD — premium reasoning & depth' },
      { id: 'agnes-1.5-flash', name: '🆓 Agnes 1.5 Flash', free: true, temperature: 0.8, maxTokens: 500, strengths: ['fast', 'concise'], bestFor: 'quick drafts & punchy takes' },
    ],
  },

  // ── Mistral AI ───────────────────────────────────────
  mistral: {
    name: 'Mistral AI',
    icon: '🌀',
    baseUrl: 'https://api.mistral.ai/v1',
    docs: 'https://console.mistral.ai/api-keys/',
    rateLimitNote: '✅ GRATIS! Free Experiment tier. 1 req/sec.',
    models: [
      { id: 'open-mistral-nemo', name: '🆓 Mistral Nemo 12B ⭐', free: true, temperature: 0.84, maxTokens: 800, strengths: ['natural_id', 'creative', 'long_form'], bestFor: '🏆 BEST OVERALL — 128K context, natural' },
      { id: 'mistral-small-latest', name: '🆓 Mistral Small ⭐', free: true, temperature: 0.83, maxTokens: 700, strengths: ['balanced', 'multilingual', 'conversational'], bestFor: '🏆 GENERAL PURPOSE — balanced, multilingual' },
      { id: 'ministral-8b-latest', name: '🆓 Ministral 8B ⭐', free: true, temperature: 0.85, maxTokens: 600, strengths: ['fast', 'concise', 'efficient'], bestFor: 'quick takes & punchy content' },
      { id: 'ministral-3b-latest', name: '🆓 Ministral 3B ⭐', free: true, temperature: 0.82, maxTokens: 450, strengths: ['ultra_fast', 'compact', 'simple'], bestFor: 'super quick drafts' },
      { id: 'mistral-tiny-latest', name: '🆓 Mistral Tiny ⭐', free: true, temperature: 0.83, maxTokens: 500, strengths: ['fast', 'simple', 'lightweight'], bestFor: 'lightweight generation' },
    ],
  },

  // ── Custom API ───────────────────────────────────────
  custom: {
    name: 'Custom API',
    icon: '🔧',
    baseUrl: '',
    models: [{ id: 'custom-model', name: 'Custom Model', temperature: 0.85, maxTokens: 700, strengths: ['unknown'], bestFor: 'custom endpoint' }],
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

export function getModelParams(provider: string, model: string): ModelOptimalParams {
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

// ============================================================
//  CORE AI CALLER — X Algorithm 2026
// ============================================================

export async function callAI(params: GenerateParams): Promise<{ content: string; provider: string; model: string }> {
  const { provider, apiKey, baseUrl, model, prompt, maxTokens, temperature } = params;

  const preset = PROVIDER_PRESETS[provider];
  if (!preset) throw new Error(`Provider ${provider} tidak dikenal`);

  const endpoint = baseUrl || preset.baseUrl;
  if (!endpoint) throw new Error(`Base URL tidak diatur untuk ${provider}`);

  const openai = new OpenAI({
    apiKey,
    baseURL: endpoint,
    dangerouslyAllowBrowser: true,
  });

  const optimal = getModelParams(provider, model);

  const res = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens || optimal.maxTokens,
    temperature: temperature ?? optimal.temperature,
  });

  return {
    content: res.choices[0]?.message?.content || '',
    provider: preset.name,
    model,
  };
}
