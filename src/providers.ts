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

export async function testConnection(params: { provider: string; apiKey: string; model: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callAI({
      ...params,
      prompt: 'Test koneksi — reply dengan OK saja',
    });
    return { success: !!result.content, error: result.content ? undefined : 'No response' };
  } catch (e: any) {
    return { success: false, error: e.message || 'Connection failed' };
  }
}
