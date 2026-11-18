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

// ── Batas kolom Twitter/X ─────────────────────────────────────────────
// Akun biasa hanya punya 280 karakter per post/reply. Twitter menghitung
// emoji & karakter CJK sebagai 2; fungsi ini meniru pembobotan itu secara
// konservatif (selector/ZWJ ikut terhitung, jadi hasil tidak pernah kurang
// dari hitungan Twitter — selalu aman).
export const TWEET_CHAR_LIMIT = 280;

export function tweetLength(text: string): number {
  let n = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) || 0;
    const wide = cp > 0xFFFF
      || (cp >= 0x1100 && cp <= 0x11FF)
      || (cp >= 0x2E80 && cp <= 0x9FFF)
      || (cp >= 0xA000 && cp <= 0xA4CF)
      || (cp >= 0xAC00 && cp <= 0xD7A3)
      || (cp >= 0xF900 && cp <= 0xFAFF)
      || (cp >= 0xFE30 && cp <= 0xFE4F)
      || (cp >= 0xFF00 && cp <= 0xFF60)
      || (cp >= 0x20000 && cp <= 0x2FFFD)
      || (cp >= 0x30000 && cp <= 0x3FFFD);
    n += wide ? 2 : 1;
  }
  return n;
}

// Pangkas teks agar muat di kolom Twitter tanpa memotong di tengah kalimat.
// Prioritas: kalimat utuh dari awal; kalimat tanya terakhir (reply bait)
// dipertahankan bila muat; terakhir potong di batas kata.
export function fitToTweetLimit(text: string, limit: number = TWEET_CHAR_LIMIT): string {
  const clean = text.replace(/\n{3,}/g, '\n\n').trim();
  if (tweetLength(clean) <= limit) return clean;

  const flat = clean.replace(/\s*\n+\s*/g, ' ').replace(/ {2,}/g, ' ').trim();
  const sentences = flat.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g)?.map(s => s.trim()).filter(Boolean) || [flat];

  let out = '';
  for (const s of sentences) {
    const cand = out ? `${out} ${s}` : s;
    if (tweetLength(cand) > limit) break;
    out = cand;
  }
  // Pertahankan reply bait: kalimat tanya terakhir yang belum ikut.
  const lastQ = [...sentences].reverse().find(s => s.includes('?'));
  if (lastQ && out && !out.includes(lastQ)) {
    const cand = `${out} ${lastQ}`;
    if (tweetLength(cand) <= limit) out = cand;
  }
  if (out && tweetLength(out) >= 60) return out.trim();

  let cut = '';
  for (const w of flat.split(' ')) {
    const cand = cut ? `${cut} ${w}` : w;
    if (tweetLength(cand) > limit) break;
    cut = cand;
  }
  return cut.replace(/[\s,;:.!?…-]+$/u, '').trim();
}

const LENGTH_RULE = `
📏 ATURAN PANJANG — WAJIB, TIDAK BISA DITAWAR:
- Maksimal 280 KARAKTER per tweet/reply (batas kolom Twitter/X akun biasa). Hitung KARAKTER, bukan kata.
- Target aman: 200–260 karakter total (sekitar 30–45 kata). Lebih pendek lebih baik daripada kepanjangan.
- Cukup 1 paragraf ringkas: 1–3 kalimat padat + reply bait singkat di akhir. BUKAN esai, BUKAN 3 paragraf.
- Emoji dihitung 2 karakter oleh Twitter — pakai 2–4 emoji saja.
- Output yang melebihi 280 karakter akan DIPOTONG otomatis oleh sistem dan bisa kehilangan reply bait-mu.
`;

const BOT_PATTERNS: Array<{ p: RegExp; r: string | ((_: string, p1: string, p2: string) => string) }> = [
  { p: /\b(Tahukah kamu bahwa|Perlu diketahui bahwa|Di era modern ini,|Pada hakikatnya,|Marilah kita|Patut kita|Sudah sepatutnya)\s*/gi, r: '' },
  { p: /\b(Semoga bermanfaat!?|Semoga informasi ini|Terima kasih telah membaca|Salam sukses!?|Sekian dan terima kasih|Semoga membantu)[.!]?\s*$/gim, r: '' },
  { p: /\b(menarik untuk dicermati|patut kita apresiasi|perlu digarisbawahi|dapat disimpulkan bahwa|marilah kita bersama|oleh karena itu|dengan demikian)\b/gi, r: '' },
  { p: /\n+(Demikianlah|Sekian|Salam hangat|Best regards|Cheers)[.!]?\s*\n?/gi, r: '\n' },
  { p: /([.!?]\s+)([a-z])/g, r: (_: string, p1: string, p2: string) => p1 + p2.toUpperCase() },
  { p: /\b(Berdasarkan data|Menurut penelitian|Studi menunjukkan|Hasil riset membuktikan)\s*/gi, r: '' },
  { p: /\b(Dalam konteks ini|Pada akhirnya|Intinya adalah|Kesimpulannya)\s*/gi, r: '' },
];

const MODEL_OUTPUT_GUARD = `
🔒 OUTPUT FINAL — BERLAKU UNTUK SEMUA MODEL:
- Keluarkan hanya teks tweet siap posting, tanpa salam, pembuka, label, header, atau penjelasan.
- Jangan menyebut nama model/provider, AI, asisten, prompt, URL, link, atau proses analisis.
- Jangan menulis kalimat seperti "Saya akan membuatkan...", "Berikut tweetnya...", atau "Sebagai AI...".
`;

function removeBotStyle(text: string): string {
  let result = text;
  for (const { p, r } of BOT_PATTERNS) result = result.replace(p, r as any);
  return result.replace(/ {2,}/g, ' ').replace(/^\n+/, '').replace(/\n+$/, '').replace(/\n{3,}/g, '\n\n').trim();
}

function removeModelPreamble(text: string): string {
  let result = text.trim();
  // Models sometimes ignore the format and introduce themselves before the tweet.
  result = result.replace(/^(?:(?:halo|hai|hello)[^\n]*|perkenalkan[^\n]*|\d+(?:\.\d+)?\s+flash\.?|saya akan (?:membuatkan|menulis|memberikan)[^\n]*)\s*/i, '');
  result = result.replace(/^(?:\s*(?:8\s+flash\.?|saya akan (?:membuatkan|menulis|memberikan)[^\n]*))+/i, '');
  return result.trim();
}

function postProcess(text: string): string {
  let t = removeModelPreamble(text);
  t = removeBotStyle(t);
  // Tanpa pemisah paragraf ala esai: balasan harus ringkas dan muat 280 karakter.
  return fitToTweetLimit(t);
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
- Jangan spam emoji sama berulang
- Maks 4 emoji total dalam 1 tweet (emoji dihitung 2 karakter oleh Twitter)
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
- Emosi & emoji harus MATCH (ikut EMOJI QUALITY GUIDE)
- Maks 4 emoji total, minimal 1 (format pendek — hemat karakter)
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
    constraints.push('⚠️ Kamu model compact: langsung to the point. Maksimal 260 karakter, 1-2 kalimat + reply bait.');
  }
  if (profile.maxTokens >= 800) {
    constraints.push('✅ Kamu model besar: tetap ringkas. Maksimal 260 karakter — padat, jangan bertele-tele.');
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
${LENGTH_RULE}
${MODEL_OUTPUT_GUARD}

✅ FORMAT OUTPUT:
- EMOJI sebagai karakter pertama (wajib)
- 1 paragraf ringkas (1-3 kalimat), tanpa jeda paragraf ala esai
- TARGET PANJANG: 200-260 KARAKTER total (sekitar 30-45 kata) — maks 280 karakter
- Akhiri dengan REPLY BAIT natural
- Personal voice: "gue/aku" (atau "I" untuk English)

⚠️ KUALITAS WAJIB:
- TIDAK BOLEH generik, klise, atau template
- TIDAK BOLEH pakai frasa formal/akademik
- HARUS ada opini personal yang tajam
- HARUS menggunakan emoji yang match emosi
- Tone harus konsisten di seluruh tweet
- JANGAN melebihi 280 karakter — lebih baik pendek dan padat daripada panjang

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

export async function generateIdeas(opts: { idea: string; imageData?: string; videoUrl?: string; language?: string; tone?: string; count?: number }) {
  const { idea, imageData = '', videoUrl = '', language = 'id', tone = 'supportif', count = 5 } = opts;
  const key = getActiveApiKey();
  if (!key) return { ideas: [] as GeneratedIdea[], provider: 'none', model: '' };

  const normalizedLanguage = language === 'en' ? 'en' : 'id';
  const langName = normalizedLanguage === 'en' ? 'English' : 'Indonesia';
  const langGuidelines = getLanguageInstructions(normalizedLanguage);
  const maxCount = Math.min(count, 10);
  const optimal = getModelParams(key.provider, key.model);
  const modelHint = getModelStrengthHint(key.provider, key.model);
  const modelConstraints = getPerModelConstraints(key.provider, key.model);

  const prompt = `KAMU ADALAH GHOSTWRITER TWITTER PROFESIONAL. BUATKAN ${maxCount} VARIASI TWEET.

🌍 BAHASA: ${langName}
  📌 IDE: "${idea || '(analisis gambar)'}"
${imageData ? '\n📷 GAMBAR TERLAMPIR: Analisis gambar yang dikirim bersama prompt. Gunakan objek, suasana, warna, aktivitas, dan konteks visualnya sebagai dasar ide. Jangan mengarang detail yang tidak terlihat.' : ''}
${videoUrl ? `\n🎬 MEDIA TERLAMPIR: Baca dan analisis media dari URL yang dikirim bersama prompt. Jika berupa foto, perhatikan objek, ekspresi, teks, suasana, dan konteks visual. Jika berupa video, perhatikan adegan, ucapan, teks layar, audio, emosi, dan konteks. Jangan mengarang detail yang tidak terlihat atau terdengar.` : ''}

${TONE_INSTRUCTION[tone] || ''}

${videoUrl ? `🎯 MODE BALASAN LANGSUNG KE MEDIA:
- Tulis sebagai komentar/reply langsung untuk posting asli, bukan artikel atau renungan.
- Kalimat pertama WAJIB menjadi hook/reaksi spontan terhadap momen paling lucu, mengejutkan, absurd, atau menarik yang benar-benar terlihat/terdengar.
- Gunakan 1-3 kalimat pendek, maksimal 240 karakter per variasi.
- Fokus pada kejadian di video. Boleh memakai humor, punchline, pertanyaan singkat, atau observasi tajam.
- Jangan mengarang motif, pesan moral, pelajaran hidup, atau kesimpulan tentang manusia jika tidak tampak jelas di video.
- Jangan memakai pembuka generik seperti "Kadang gue...", "Video ini mengajarkan...", "Ini bukan berarti...", atau "Alam selalu...".
- Jangan menjelaskan bahwa kamu sedang menganalisis video; langsung balas seolah-olah kamu melihat posting tersebut.` : ''}

${langGuidelines}
${EMOJI_QUALITY_GUIDE}
${modelHint}${modelConstraints}
${VIRAL_HOOK_STRATEGY}
${ALGO_REPLY_BAIT}
${EMOJI_RULES}
${ALGO_ANTI_PENALTY}
${LENGTH_RULE}
${MODEL_OUTPUT_GUARD}

✅ FORMAT OUTPUT — TIAP VARIASI DIPISAH "---":
---
[EMOJI] tweet ke-1
---
[EMOJI] tweet ke-2
(dan seterusnya)

⚠️ SETIAP TWEET HARUS:
- LANGSUNG mulai dengan isi tweet. JANGAN memberi salam, pengantar, penjelasan, atau kalimat seperti "Saya akan...".
- JANGAN menyebut nama model, Gemini, AI, asisten, prompt, URL, link, atau proses analisis.
- ${videoUrl ? 'Maksimal 240 karakter; ringkas seperti balasan di kolom komentar' : 'Maksimal 260 KARAKTER (sekitar 30-45 kata); 1 paragraf ringkas, padat seperti reply di kolom komentar'}
- Hook berbeda (random dari 8 hook types)
- Emoji emosi yang match (ikut EMOJI QUALITY GUIDE)
- Personal voice: "gue/aku" atau "I" untuk English
- Akhiri reply bait natural
- TIDAK BOLEH ada kalimat generik, klise, atau template
- TIDAK BOLEH pakai frasa formal/akademik
- ${videoUrl ? 'JANGAN melebihi 240 karakter' : 'JANGAN melebihi 280 karakter — batas keras kolom Twitter'}

TULIS ${maxCount} TWEET:`;

  try {
    const result = await callAI({
      provider: key.provider,
      apiKey: key.api_key,
      model: key.model,
      prompt,
      imageData,
      videoUrl,
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

    return { ideas, provider: key.provider, model: key.model };
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e || 'Kesalahan provider tidak diketahui');
    return { ideas: [] as GeneratedIdea[], provider: key.provider, model: key.model, error: message };
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
