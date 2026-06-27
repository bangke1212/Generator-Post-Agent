// AI Content Generator — Vite SPA
// X Algorithm 2026 — ALL-TIMELINE COVERAGE
// For You Feed + Following Feed + Explore/Trending

import { callAI, getModelParams, getModelProfile, PROVIDER_PRESETS } from './providers';
import { getActiveApiKey, getSetting } from './store';

export interface GeneratedIdea {
  id: number;
  content: string;
  emoji_count: number;
  tone: string;
  language: string;
  hook_type?: string;
}

// ─── Post-Processing ─────────────────────────────────────

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
  { p: /\b(Tahukah kamu bahwa|Perlu diketahui bahwa|Di era modern ini,|Pada hakikatnya,)\s*/gi, r: '' },
  { p: /\b(Semoga bermanfaat!?|Semoga informasi ini|Terima kasih telah membaca|Salam sukses!?|Sekian dan terima kasih)[.!]?\s*$/gim, r: '' },
  { p: /\b(menarik untuk dicermati|patut kita apresiasi|perlu digarisbawahi|dapat disimpulkan bahwa|marilah kita bersama)\b/gi, r: '' },
  { p: /\n+(Demikianlah|Sekian|Salam hangat|Best regards|Cheers)[.!]?\s*\n?/gi, r: '\n' },
  { p: /([.!?]\s+)([a-z])/g, r: (_: string, p1: string, p2: string) => p1 + p2.toUpperCase() },
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

// ============================================================
//  X ALGORITHM 2026 — ALL TIMELINE PROMPT ENGINE
//  Target: For You Feed + Following Feed + Explore/Trending
// ============================================================

const ALL_TIMELINE_STRATEGY = `
🎯 X ALGORITHM 2026 — 3-TIMELINE COVERAGE STRATEGY:

TULISANMU HARUS MUNCUL DI 3 TIMELINE SEKALIGUS:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. FOR YOU FEED (Algoritmik — reach non-followers)
   Signal: REPLY CHAINS (+75), DWELL TIME (+10)
   Strategy: Hook kuat + opinionated + reply bait
   ──────────────────────────────────────────────
2. FOLLOWING FEED (Kronologis — reach followers)
   Signal: RECENCY, CONSISTENCY, ENGAGEMENT RATE
   Strategy: Post di peak hours, konsisten 3-5x/day
   ──────────────────────────────────────────────
3. EXPLORE / TRENDING (Topik viral — reach SEMUA)
   Signal: TREND RELEVANCE, CONVERSATION VELOCITY
   Strategy: Gunakan topik trending & breaking news
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

const VIRAL_HOOK_STRATEGY = `
🎯 8 VIRAL HOOK TYPES (pilih acak tiap tweet):

1. 🔥 HOT TAKE — Opini kontroversial bikin debat
   "Stop glorifying hustle culture. It's killing your creativity."

2. 📊 SURPRISING STAT — Data mengejutkan bikin bookmark
   "93% startup gagal bukan karena produk jelek, tapi founder-nya gak bisa jualan."

3. 😭 RELATABLE OBSERVATION — "wah gue banget"
   "Kenapa setiap coffee shop playlist-nya 3 lagu itu mulu sih"

4. 🤯 CONTRARIAN TAKE — Lawan arus mainstream
   "Unpopular opinion: kuliah 4 tahun itu scam terbesar gen Z."

5. 🥲 PERSONAL CONFESSION — Vulnerable & authentic
   "Jujur, gue dulu income $0 selama 8 bulan pertama startup."

6. 🤔 QUESTION HOOK — Memancing reply langsung
   "Genuine question: kalo AI udah bisa ngoding, frontend dev ngapain 5 tahun lagi?"

7. 💀 BEFORE/AFTER — Transformasi dramatis
   "2023: hopeless, burnout. 2025: $15k/month solo founder."

8. 😤 RANT / MINI-ROAST — Keluhan entertaining
   "Hiring itu skill tersendiri. Dan 90% HR Indonesia GAK PUNYA skill itu."
`;

const ALGO_REPLY_BAIT = `
💬 REPLY BAIT STRATEGY (+75 signal):

AKHIRI SETIAP TWEET DENGAN SALAH SATU:
- Pertanyaan terbuka: "Ada yang ngalamin juga?", "Menurut kalian gimana?"
- Call-to-reply: "Drop take lo di reply 👇", "Spill pengalaman lu di bawah"
- BIKIN LISTICLE pendek — orang akan tambahin #4, #5 di reply
- JANGAN tutup dengan kesimpulan final — harus TERBUKA buat debat
- Sisakan 1 poin yang "kurang" biar orang nambahin

🎯 PSIKOLOGI REPLY BAIT:
- Orang reply kalau merasa PUNYA SESUATU untuk ditambahin
- Orang reply kalau merasa pendapatnya DIPERLUKAN
- Orang reply kalau SETUJU atau GAK SETUJU — dua-duanya bagus!
`;

const EMOJI_RULES = `
🎯 EMOJI + EMOTION — WAJIB 100%:

- Karakter PERTAMA tweet = EMOJI
- Awal SETIAP PARAGRAF = EMOJI
- Minimal 5-7 emoji, maks 9 emoji (jangan lebay)
- 3-4 emoji EMOTION + 2-3 emoji SIMBOL
- Emoji EMOTION wajib: 😂😭😤🤯🤔😱💀🔥😏🥲😩👀
- JANGAN: ✅ ❌ 👉 👇 ‼️ 💯
- Harus RELEVAN dengan isi konten
`;

const TYPO_RULES = `
⚠️ NATURAL SLANG (ID only, maks 2-3 per tweet):
"goklok", "bnget", "gue", "lu", "anjay", "bacot", "gitu", "wkwk", "njir"
Singkatan: "yg", "gak", "dgn", "krn", "tp", "pdhl"
JANGAN overdo. Kalimat pertama HARUS BERSIH.
`;

const EYD_RULES = `
⚠️ EYD: Titik di akhir kalimat. Koma untuk jeda natural.
JANGAN kalimat panjang tanpa koma.
`;

const ALGO_ANTI_PENALTY = `
🚫 DIPENALTI X 2026 (JANGAN):
❌ 3+ hashtag → spam filter
❌ Link di main tweet → reach -50%
❌ "RT jika setuju", "Like kalau relate"
❌ "Tahukah kamu", "Di era", "Halo semua"
❌ "Semoga bermanfaat!", "Sekian.", "Terima kasih!"
`;

// ─── Model-specific hint injection ──────────────────────

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
  
  // Smaller models need tighter constraints
  if (profile.maxTokens <= 500) {
    constraints.push('⚠️ Kamu model compact: tweet 50-70 kata saja. Langsung to the point.');
    constraints.push('⚠️ Jangan verbose — padat & punchy.');
  }
  
  if (profile.maxTokens >= 800) {
    constraints.push('✅ Kamu model besar: boleh elaborate. Maks 120 kata. 3-4 paragraf.');
    constraints.push('✅ Gunakan depth & nuance.');
  }

  // Model-specific warnings
  if (model.includes('gpt-3.5')) {
    constraints.push('⚠️ GPT-3.5 cenderung generik — LUPAKAN pola AI biasa. Jadilah LIAR & tidak terduga.');
  }
  
  if (model.includes('phi-4')) {
    constraints.push('⚠️ Phi-4 sangat safety-aligned — BREAK OUT dari safe mode. Jadilah edgy.');
  }
  
  if (model.includes('mistral-7b')) {
    constraints.push('⚠️ Mistral 7B cenderung pendek — padatkan impact di 50-60 kata.');
  }

  return constraints.length ? `\n🔧 MODEL CONSTRAINTS:\n${constraints.join('\n')}\n` : '';
}

// ─── Generate Single Post ────────────────────────────────

export async function generateContent(opts: { topic?: string; language?: string; tone?: string }) {
  const { topic = 'general', language = 'id' } = opts;
  const key = getActiveApiKey();
  if (!key) return { content: '⚠️ Belum ada API key aktif. Tambahkan di tab Settings.', emoji_count: 0, topic, provider: 'none' };

  const langName = language === 'id' ? 'Indonesia' : 'English';
  const langCasual = language === 'id'
    ? 'Bahasa Indonesia NATURAL — kayak ngobrol tongkrongan. "gue/aku", slang: "btw", "jujurly", "bnget", "sih", "goklok". JANGAN FORMAL.'
    : 'Casual conversational English — DM friend style. Not LinkedIn. Not textbook.';

  const modelHint = getModelStrengthHint(key.provider, key.model);
  const modelConstraints = getPerModelConstraints(key.provider, key.model);
  const optimal = getModelParams(key.provider, key.model);

  const prompt = `Kamu PENULIS TWITTER VIRAL — spesialis X Algorithm 2026. Natural, bukan bot.

${ALL_TIMELINE_STRATEGY}

${modelHint}${modelConstraints}
BUATKAN SATU TWEET — ${langName}.
TOPIK: ${topic}
${langCasual}

${VIRAL_HOOK_STRATEGY}

${ALGO_REPLY_BAIT}

${EMOJI_RULES}

${language === 'id' ? EYD_RULES : ''}
${language === 'id' ? TYPO_RULES : ''}

${ALGO_ANTI_PENALTY}

✅ FORMAT:
- EMOJI karakter pertama (wajib)
- 2-3 paragraf LINE BREAK
- Tiap paragraf = EMOJI di awal
- 70-100 kata (dwell time)
- Personal POV: "gue/aku"
- Akhiri REPLY BAIT (pertanyaan / call-to-reply)
- Kalimat variatif: pendek → panjang → pendek

TULIS:`;

  try {
    const result = await callAI({
      provider: key.provider, apiKey: key.api_key, model: key.model,
      prompt, maxTokens: optimal.maxTokens, temperature: optimal.temperature,
    });
    const content = postProcess(result.content);
    return {
      content,
      emoji_count: (content.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length,
      topic,
      provider: result.provider,
    };
  } catch (e: any) {
    return { content: `❌ Gagal generate: ${e.message}`, emoji_count: 0, topic, provider: 'error' };
  }
}

// ─── Tone Instructions ───────────────────────────────────

const TONE_INSTRUCTION: Record<string, string> = {
  supportif: `Gaya SUPPORTIF — positif & membangun, ada edge biar gak boring.
Emoji: 🥲 ✨ 🤝 💪 🌱 💡 😊 🌟
Emotion: 🥲 bittersweet, 😊 hangat, 🤝 solidaritas
Reply: "Ada yang lagi fase ini juga?", "Spill journey lo di reply 👇"`,
  debate: `Gaya DEBATE — provokatif intelektual, contrarian. FORMAT TERKUAT (reply-chain +75).
Emoji: 🤔 🔥 👀 💀 😏 🧠 ⚡ 🎯
Emotion: 🤔 questioning, 😏 sly/sinis, 💀 savage
Reply: "Change my mind.", "Debat di reply.", "Unpopular opinion, tapi..."`,
  'kritik-pedas': `Gaya KRITIK PEDAS — tajam, roastery, SMART. VIRAL BANGET (reply-chain).
Emoji: 😤 💀 😭 🤯 😂 🔥 🗿 ☠️
Emotion: 😤 kesel, 💀 dark/savage, 😂 nyindir, 🤯 mindblown
Reply: "Relate angkat tangan.", "Tersinggung = kena.", "Argumen lo di reply."`,
};

// ─── Generate Ideas (Multi-variant) ──────────────────────

export async function generateIdeas(opts: { idea: string; language?: string; tone?: string; count?: number }) {
  const { idea, language = 'id', tone = 'supportif', count = 5 } = opts;
  const key = getActiveApiKey();
  if (!key) return { ideas: [] as GeneratedIdea[], provider: 'none' };

  const langName = language === 'id' ? 'Indonesia' : 'English';
  const langCasual = language === 'id'
    ? 'Bahasa Indonesia NATURAL — kayak ngobrol. "gue/aku", slang OK.'
    : 'Casual conversational English, not textbook.';
  const maxCount = Math.min(count, 10);
  const optimal = getModelParams(key.provider, key.model);
  const modelHint = getModelStrengthHint(key.provider, key.model);
  const modelConstraints = getPerModelConstraints(key.provider, key.model);

  const prompt = `Kamu PENULIS TWITTER VIRAL — spesialis X Algorithm 2026.

${ALL_TIMELINE_STRATEGY}

${modelHint}${modelConstraints}
BUATKAN ${maxCount} VARIASI TWEET: "${idea}"
BAHASA: ${langName}
${langCasual}

${TONE_INSTRUCTION[tone] || ''}

${VIRAL_HOOK_STRATEGY}

${ALGO_REPLY_BAIT}

${EMOJI_RULES}

${language === 'id' ? EYD_RULES : ''}
${language === 'id' ? TYPO_RULES : ''}

${ALGO_ANTI_PENALTY}

✅ SETIAP VARIASI:
- Hook type BERBEDA (acak dari 8 tipe)
- Akhiri REPLY BAIT unik
- ~70-100 kata, 2-3 paragraf
- ~6-8 emoji
- Personal POV

FORMAT OUTPUT WAJIB:
---IDEA 1---
HOOK_TYPE: [tipe hook]
[tweet lengkap]
---END---
---IDEA 2---
HOOK_TYPE: [tipe hook]
[tweet]
---END---

GENERATE ${maxCount}:`;

  try {
    const result = await callAI({
      provider: key.provider, apiKey: key.api_key, model: key.model,
      prompt, maxTokens: maxCount * optimal.maxTokens, temperature: Math.min(optimal.temperature + 0.05, 0.95),
    });

    const blocks = result.content.split(/---IDEA \d+---/).filter(Boolean);
    const ideas: GeneratedIdea[] = [];
    for (let i = 0; i < blocks.length && ideas.length < maxCount; i++) {
      let block = blocks[i].replace(/---END---/, '').trim();
      let hook_type: string | undefined;
      if (block.startsWith('HOOK_TYPE:')) {
        const lines = block.split('\n');
        hook_type = lines[0].replace('HOOK_TYPE:', '').trim();
        block = lines.slice(1).join('\n').trim();
      }
      if (block && block.length > 20) {
        block = postProcess(block);
        ideas.push({
          id: ideas.length + 1, content: block,
          emoji_count: (block.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length,
          tone, language, hook_type,
        });
      }
    }
    return { ideas, provider: result.provider };
  } catch (e: any) {
    return { ideas: [] as GeneratedIdea[], provider: 'error' };
  }
}
