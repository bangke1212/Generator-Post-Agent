// AI Content Generator — Vite SPA
// X Algorithm 2026 — ALL-TIMELINE COVERAGE
// For You Feed + Following Feed + Explore/Trending

import { callAI, getModelParams, getModelProfile } from './providers';
import { getActiveApiKey } from './store';

export interface GeneratedIdea {
  id: number;
  content: string;
  emoji_count: number;
  tone: string;
  language: string;
  hook_type?: string;
}

function ensureParagraphSpacing(text: string): string {
  if (!text) return text;
  let result = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  if (!result.includes('\n\n')) {
    const sentences = result.match(/[^.!?\n]+[.!?]+\s*/g);
    if (sentences && sentences.length >= 3) {
      const paragraphs: string[] = [];
      const pp = Math.ceil(sentences.length / 3);
      for (let i = 0; i < sentences.length; i += pp) paragraphs.push(sentences.slice(i, i + pp).join('').trim());
      result = paragraphs.join('\n\n');
    }
  }
  const paragraphs = result.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  if (paragraphs.length === 1 && paragraphs[0].length > 200) {
    const parts: string[] = [];
    let cur = '';
    for (const word of paragraphs[0].split(' ')) {
      cur += (cur ? ' ' : '') + word;
      if (cur.length > 100 && /[.!?]$/.test(word)) { parts.push(cur.trim()); cur = ''; }
    }
    if (cur.trim()) parts.push(cur.trim());
    if (parts.length > 1) return parts.join('\n\n');
  }
  return paragraphs.join('\n\n');
}

const BOT_PATTERNS: Array<{ p: RegExp; r: string | ((_: string, p1: string, p2: string) => string) }> = [
  { p: /\b(Tahukah kamu bahwa|Perlu diketahui bahwa|Di era modern ini,|Pada hakikatnya,|Marilah kita|Patut kita|Sudah sepatutnya)\s*/gi, r: '' },
  { p: /\b(Semoga bermanfaat!?|Semoga informasi ini|Terima kasih telah membaca|Salam sukses!?|Sekian dan terima kasih|Semoga membantu)[.!]?\s*$/gim, r: '' },
  { p: /\b(menarik untuk dicermati|patut kita apresiasi|perlu digarisbawahi|dapat disimpulkan bahwa|marilah kita bersama|oleh karena itu|dengan demikian)\b/gi, r: '' },
  { p: /\n+(Demikianlah|Sekian|Salam hangat|Best regards|Cheers)[.!]?\s*\n?/gi, r: '\n' },
  { p: /([.!?]\s+)([a-z])/g, r: (_: string, p1: string, p2: string) => p1 + p2.toUpperCase() },
  { p: /\b(Berdasarkan data|Menurut penelitian|Studi menunjukkan|Hasil riset membuktikan)\s*/gi, r: '' },
  { p: /\b(Dalam konteks ini|Pada akhirnya|Intinya adalah|Kesimpulannya)\s*/gi, r: '' },
];

function removeBotStyle(text: string): string {
  let result = text;
  for (const { p, r } of BOT_PATTERNS) result = result.replace(p, r as any);
  return result.replace(/ {2,}/g, ' ').replace(/^\n+/, '').replace(/\n+$/, '').replace(/\n{3,}/g, '\n\n').trim();
}

function postProcess(text: string): string {
  let t = ensureParagraphSpacing(text);
  t = removeBotStyle(t);
  return ensureParagraphSpacing(t);
}

const EMOJI_QUALITY_GUIDE = `
🎨 EMOJI & EMOTION QUALITY GUIDE:

EMOSI → EMOJI MAPPING (WAJIB IKUTI):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😤 Marah/frustrasi  → 🤬😡💢
😂 Lucu/absurd      → 😭💀🤣
😢 Sedih/menyentuh  → 🥲😔💔
🤯 Kaget/mindblown  → 🤯😱👀
🔥 Semangat/hype    → 🔥⚡🚀
😏 Sinis/sarkastik  → 🗿🙃😮‍💨
🥰 Wholesome/happy  → 🥰✨💖
🤔 Kontemplatif     → 🤔🧐💭
😈 Roasting/nyindir �� 🗣️🔥💀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATURAN PAKAI EMOJI:
- Pertama karakter = emoji yang SET MOOD
- Awal paragraf = emoji transisi yang nyambung
- Jangan spam emoji sama berulang
- Maks 7 emoji total dalam 1 tweet
- Emoji harus mendukung emosi teks, bukan dekorasi kosong

🚫 EMOJI DILARANG: ✅ ❌ 👉 👇 ‼️ 💯 🔴 🟢 🟡 ⬇️ ⬆️ ➡️
`;

const VIRAL_HOOK_STRATEGY = `
🎯 8 VIRAL HOOKS (random tiap tweet):
1. 🔥 HOT TAKE — opini kontroversial memancing debat
2. 📊 MIND-BLOWING FACT — fakta mengejutkan bikin orang bookmark
3. 😭 RELATABLE STRUGGLE — "ini gue banget" authenticity
4. 🤯 UNPOPULAR OPINION — lawan arus mainstream
5. 🥲 PERSONAL STORY — vulnerable, authentic, real experience
6. 🎯 DIRECT CHALLENGE — tantang pembaca langsung
7. 💀 TRANSFORMATION — before/after yang dramatis
8. 😤 RANT / ROAST — keluhan entertaining, bukan toxic
`;

const ALGO_REPLY_BAIT = `
💬 REPLY BAIT STRATEGY (+75 signal):
SELALU AKHIRI DENGAN:
- Pertanyaan terbuka: "Ada yang ngalamin juga?", "Gimana versi kalian?"
- Call-to-reply natural: "Spill pengalaman lo 👇", "Drop hot take lo"
- JANGAN tutup dengan kesimpulan — biarin TERBUKA buat diskusi
- Jangan terlalu pushy — harus natural seperti ngobrol
`;

const EMOJI_RULES = `
🎭 EMOJI SYSTEM:
- Karakter PERTAMA tweet = emoji yg SET MOOD
- Tiap awal paragraf = emoji transisi
- Emosi & emoji harus MATCH (ikut EMOJI QUALITY GUIDE)
- Maks 7 emoji total, minimal 4 emoji
- NO: ✅ ❌ 👉 👇 ‼️ 💯 🔴 🟢 🟡
`;

const TONE_GUIDE_ID = `
🗣️ VOICE GUIDE (Bahasa Indonesia):
- Natural kayak ngobrol di tongkrongan
- "gue/aku" bukan "kita/saya"
- Slang boleh (maks 3): "bnget", "gokil", "parah sih"
- JANGAN FORMAL, JANGAN AKADEMIK, JANGAN BASA-BASI
- JANGAN PAKE: "dalam hal ini", "menurut saya pribadi", "perlu kita pahami"
- EYD: titik di akhir kalimat, koma buat jeda
`;

const TONE_GUIDE_EN = `
🗣️ VOICE GUIDE (English):
- Casual, conversational, internet-native
- "I" not "we", personal not academic
- Internet slang OK: "fr", "ngl", "tbh", "lowkey", "wild"
- NO: "In conclusion", "Furthermore", "It is important to note"
`;

const ALGO_ANTI_PENALTY = `
🚫 X ALGORITHM PENALTIES:
- NO 3+ hashtags, NO links in main tweet
- NO "RT if you agree", "Like and share"
- NO engagement bait phrases
- NO "Tahukah kamu", "Semoga bermanfaat"
`;

function getModelStrengthHint(provider: string, model: string): string {
  const profile = getModelProfile(provider, model);
  if (!profile || !profile.strengths.length) return '';
  const hints: string[] = [];
  if (profile.strengths.includes('natural_id')) hints.push('✨ Kamu JAGO bahasa Indonesia natural.');
  if (profile.strengths.includes('emoji_rich')) hints.push('✨ Emoji-mu kreatif & pas konteks.');
  if (profile.strengths.includes('debate')) hints.push('✨ Debat & contrarian take adalah spesialismu.');
  if (profile.strengths.includes('deep_reasoning')) hints.push('✨ Reasoning-mu dalam & nuanced.');
  if (profile.strengths.includes('creative')) hints.push('✨ Kreativitasmu di atas rata-rata.');
  if (!hints.length) return '';
  return `\n🎭 MODEL STRENGTHS (gunakan kelebihanmu):\n${hints.join('\n')}\n`;
}

function getPerModelConstraints(provider: string, model: string): string {
  const profile = getModelProfile(provider, model);
  if (!profile) return '';
  const constraints: string[] = [];
  if (profile.maxTokens <= 500) {
    constraints.push('⚠️ Kamu model compact: tweet 120-150 kata saja. Langsung to the point dan padat.');
  }
  if (profile.maxTokens >= 800) {
    constraints.push('✅ Kamu model besar: boleh elaborate. Target 120-150 kata.');
  }
  return constraints.length ? `\n🔧 MODEL CONSTRAINTS:\n${constraints.join('\n')}\n` : '';
}

function getLanguageInstructions(language: string) {
  const normalized = language === 'en' ? 'en' : 'id';
  return normalized === 'en' ? TONE_GUIDE_EN : TONE_GUIDE_ID;
}

export async function generateContent(opts: { topic?: string; language?: string; tone?: string }) {
  const { topic = 'general', language = 'id' } = opts;
  const key = getActiveApiKey();
  if (!key) return { content: '⚠️ Belum ada API key aktif. Buka Settings → pilih provider → input key → Simpan & Aktifkan.', emoji_count: 0, topic, provider: 'none' };

  const normalizedLanguage = language === 'en' ? 'en' : 'id';
  const langName = normalizedLanguage === 'en' ? 'English' : 'Indonesia';
  const langGuidelines = getLanguageInstructions(normalizedLanguage);

  const modelHint = getModelStrengthHint(key.provider, key.model);
  const modelConstraints = getPerModelConstraints(key.provider, key.model);
  const optimal = getModelParams(key.provider, key.model);

  const prompt = `KAMU ADALAH GHOSTWRITER TWITTER PROFESIONAL. BUATKAN 1 TWEET VIRAL.

🌍 BAHASA: ${langName}
📌 TOPIK: ${topic}

${langGuidelines}

${EMOJI_QUALITY_GUIDE}
${modelHint}${modelConstraints}
${VIRAL_HOOK_STRATEGY}
${ALGO_REPLY_BAIT}
${EMOJI_RULES}
${ALGO_ANTI_PENALTY}

✅ FORMAT OUTPUT:
- EMOJI sebagai karakter pertama (wajib)
- 2-3 paragraf pendek
- Tiap paragraf diawali emoji yang nyambung
- TARGET PANJANG: 120-150 kata total
- Akhiri dengan REPLY BAIT natural
- Personal voice: "gue/aku" (atau "I" untuk English)

⚠️ KUALITAS WAJIB:
- TIDAK BOLEH generik, klise, atau template
- TIDAK BOLEH pakai frasa formal/akademik
- HARUS ada opini personal yang tajam
- HARUS menggunakan emoji yang match emosi
- Tone harus konsisten di seluruh tweet
- JANGAN lebih pendek dari 120 kata atau lebih panjang dari 150 kata

TULIS TWEET-NYA SAJA, TANPA LABEL, TANPA HEADER:`;

  try {
    const result = await callAI({
      provider: key.provider,
      apiKey: key.api_key,
      model: key.model,
      prompt,
      maxTokens: optimal.maxTokens,
      temperature: optimal.temperature,
    });
    const content = postProcess(result.content);
    return { content, emoji_count: (content.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length, topic, provider: result.provider };
  } catch (e: any) {
    return { content: `❌ Gagal generate: ${e.message}`, emoji_count: 0, topic, provider: 'error' };
  }
}

const TONE_INSTRUCTION: Record<string, string> = {
  supportif: `🎭 TONE: SUPPORTIF — positif & membangun, kayak teman kasih semangat.
EMOJI TONE: 🥰✨💖🌱🤗 — wholesome vibes.
HOOK: personal story atau relatable struggle.
REPLY BAIT: "Ada yang lagi fase ini juga? 🥰"`,

  debate: `🎭 TONE: DEBATE — provokatif intelektual, smart & sharp.
EMOJI TONE: 🤔🧐🔥🗿 — thinking + fire.
HOOK: hot take atau unpopular opinion.
REPLY BAIT: "Change my mind.", "Debat di reply, gue siap 🔥"`,

  'kritik-pedas': `🎭 TONE: KRITIK PEDAS — tajam, roastery, tapi tetap entertaining bukan toxic.
EMOJI TONE: 💀😮‍💨🗣️🔥 — skull + roast energy.
HOOK: rant atau roast observation.
REPLY BAIT: "Relate angkat tangan 💀", "Yang ngerasa kena, sini ngaku 👇"`,
};

export async function generateIdeas(opts: { idea: string; language?: string; tone?: string; count?: number }) {
  const { idea, language = 'id', tone = 'supportif', count = 5 } = opts;
  const key = getActiveApiKey();
  if (!key) return { ideas: [] as GeneratedIdea[], provider: 'none' };

  const normalizedLanguage = language === 'en' ? 'en' : 'id';
  const langName = normalizedLanguage === 'en' ? 'English' : 'Indonesia';
  const langGuidelines = getLanguageInstructions(normalizedLanguage);
  const maxCount = Math.min(count, 10);
  const optimal = getModelParams(key.provider, key.model);
  const modelHint = getModelStrengthHint(key.provider, key.model);
  const modelConstraints = getPerModelConstraints(key.provider, key.model);

  const prompt = `KAMU ADALAH GHOSTWRITER TWITTER PROFESIONAL. BUATKAN ${maxCount} VARIASI TWEET.

🌍 BAHASA: ${langName}
📌 IDE: "${idea}"

${TONE_INSTRUCTION[tone] || ''}

${langGuidelines}
${EMOJI_QUALITY_GUIDE}
${modelHint}${modelConstraints}
${VIRAL_HOOK_STRATEGY}
${ALGO_REPLY_BAIT}
${EMOJI_RULES}
${ALGO_ANTI_PENALTY}

✅ FORMAT OUTPUT — TIAP VARIASI DIPISAH "---":
---
[EMOJI] tweet ke-1
---
[EMOJI] tweet ke-2
(dan seterusnya)

⚠️ SETIAP TWEET HARUS:
- 120-150 kata (padat, berbobot)
- Hook berbeda (random dari 8 hook types)
- Emoji emosi yang match (ikut EMOJI QUALITY GUIDE)
- Personal voice: "gue/aku" atau "I" untuk English
- Akhiri reply bait natural
- TIDAK BOLEH ada kalimat generik, klise, atau template
- TIDAK BOLEH pakai frasa formal/akademik
- JANGAN kurang dari 120 kata atau lebih dari 150 kata

TULIS ${maxCount} TWEET:`;

  try {
    const result = await callAI({
      provider: key.provider,
      apiKey: key.api_key,
      model: key.model,
      prompt,
      maxTokens: optimal.maxTokens * 2,
      temperature: optimal.temperature,
    });

    const parts = result.content
      .split(/\n?-{3,}\n?|\n?={3,}\n?|\n?\*{3,}\n?/)
      .map(p => postProcess(p.trim()))
      .filter(p => p.length > 15);

    const hookTypes = [
      '🔥 Hot Take', '📊 Surprising Stat', '😭 Relatable', '🤯 Unpopular Opinion',
      '🥲 Personal Story', '🎯 Direct Challenge', '💀 Transformation', '😤 Rant/Roast',
    ];

    const ideas: GeneratedIdea[] = parts.slice(0, maxCount).map((content, i) => ({
      id: i + 1,
      content,
      emoji_count: (content.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length,
      tone: tone || 'general',
      language: normalizedLanguage || 'id',
      hook_type: hookTypes[i % hookTypes.length],
    }));

    return { ideas, provider: key.provider };
  } catch (e: any) {
    return { ideas: [] as GeneratedIdea[], provider: 'error' };
  }
}

export async function generateWithTopic(model: string, topic: string, apiKey?: string): Promise<string> {
  const r = await generateContent({ topic, language: 'id' });
  return r.content;
}

export async function generateWithIdea(model: string, idea: string, apiKey?: string): Promise<GeneratedIdea[]> {
  const r = await generateIdeas({ idea, language: 'id', tone: 'supportif', count: 5 });
  return r.ideas;
}

export const DEFAULT_LANGUAGE = 'id';
