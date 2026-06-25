// Multi-provider AI — Vite client-side (no backend)

import OpenAI from 'openai';

export interface ProviderConfig {
  name: string;
  icon: string;
  baseUrl: string;
  models: { id: string; name: string }[];
  docs?: string;
}

export const PROVIDER_PRESETS: Record<string, ProviderConfig> = {
  openrouter: {
    name: 'OpenRouter',
    icon: '🔀',
    baseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/keys',
    models: [
      { id: 'google/gemini-2.0-flash-001', name: '🆓 Gemini 2.0 Flash (Best Free)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: '🆓 Llama 3.3 70B (Free)' },
      { id: 'deepseek/deepseek-r1-distill-llama-70b', name: '🆓 DeepSeek R1 70B (Free)' },
      { id: 'mistralai/mistral-7b-instruct', name: '🆓 Mistral 7B (Free)' },
      { id: 'qwen/qwen-2.5-7b-instruct', name: '🆓 Qwen 2.5 7B (Free)' },
      { id: 'microsoft/phi-4', name: '🆓 Phi-4 (Free)' },
    ],
  },
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    baseUrl: 'https://api.openai.com/v1',
    docs: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o-mini', name: '💰 GPT-4o Mini (Murah)' },
      { id: 'gpt-3.5-turbo', name: '💰 GPT-3.5 Turbo (Murah)' },
      { id: 'gpt-4o', name: '💎 GPT-4o (Mahal)' },
    ],
  },
  gemini: {
    name: 'Gemini',
    icon: '💎',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    docs: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.0-flash', name: '🆓 Gemini 2.0 Flash (Free Tier)' },
      { id: 'gemini-1.5-flash', name: '🆓 Gemini 1.5 Flash (Free Tier)' },
    ],
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1',
    docs: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: '🆓 Llama 3.3 70B (Free)' },
      { id: 'llama-3.1-8b-instant', name: '🆓 Llama 3.1 8B (Free)' },
      { id: 'gemma2-9b-it', name: '🆓 Gemma 2 9B (Free)' },
      { id: 'mixtral-8x7b-32768', name: '🆓 Mixtral 8x7B (Free)' },
    ],
  },
  agnes: {
    name: 'Agnes AI',
    icon: '🦉',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    docs: 'https://platform.agnes-ai.com/settings/apiKeys',
    models: [
      { id: 'agnes-2.0-flash', name: '🆓 Agnes 2.0 Flash (Free)' },
      { id: 'agnes-2.0-pro', name: '🆓 Agnes 2.0 Pro (Free)' },
      { id: 'agnes-1.5-flash', name: '🆓 Agnes 1.5 Flash (Free)' },
      { id: 'agnes-image-2.0', name: '🆓 Agnes Image 2.0' },
    ],
  },
  custom: {
    name: 'Custom API',
    icon: '🔧',
    baseUrl: '',
    models: [{ id: 'custom-model', name: 'Custom Model' }],
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

export async function callAI(params: GenerateParams): Promise<{ content: string; provider: string; model: string }> {
  const { provider, apiKey, baseUrl, model, prompt, maxTokens = 600, temperature = 0.8 } = params;

  const preset = PROVIDER_PRESETS[provider];
  const url = baseUrl || preset?.baseUrl || 'https://api.openai.com/v1';

  const openai = new OpenAI({
    apiKey,
    baseURL: url,
    dangerouslyAllowBrowser: true,
  });

  const res = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
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
