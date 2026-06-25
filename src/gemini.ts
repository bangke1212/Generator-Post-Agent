// AI Content Generator — Vite SPA, calls AI provider directly

import { callAI, PROVIDER_PRESETS } from './providers';
import { getActiveApiKey, getSetting } from './store';

export interface GeneratedIdea {
  id: number;
  content: string;
  emoji_count: number;
  tone: string;
  language: string;
}

// ---- Paragraph Spacing ----

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

// ---- Anti-Bot Filter ----

const BOT_PATTERNS: Array<{ p: RegExp; r: string }> = [
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

// ---- Templates ----

const TOPIC_ICONS: Record<string, string> = {
  teknologi: '💻', bisnis: '💼', motivasi: '✨', crypto: '₿', AI: '🤖', produktivitas: '⏰', startup: '🚀', lifehack: '💡', general: '🎲',
};

// ---- NATURAL TYPO PRESET (all providers) ----
// Biar AI nulis kayak orang Indo beneran — ada typo sedikiiit

const TYPO_RULES = `
⚠️ NATURAL: MASUKKIN 1-2 KATA GAUL/SLANG ALAMI per paragraf. Contoh kata gaul:
- "goklok", "bnget", "gue", "lu", "anjay", "bacot", "ngpain", "gitu", "yaelah", "wkwk", "njir"
- Singkatan natural: "yg", "gak", "dgn", "krn", "ato", "tp", "dr", "pdhl"
JANGAN OVERDO — maks 2-3 slang/gaul per TWEET. Harus masih enak dibaca & ga dipaksa.
Kalimat pertama harus BERSIH (ga ada slang) biar hook-nya kuat.
`;

const EMOJI_RULES = `
🎯 WAJIB EMOJI + EMOTION — INI PALING PENTING:
- AWAL TWEET: WAJIB mulai dengan 1-2 emoji (contoh: "🔥", "🤯", "😭", "💀", "👀", "🤔", "😤", "😂", "🚀")
- AWAL PARAGRAF: SETIAP paragraf HARUS diawali emoji yang berbeda
- EMOTION EMOJI: WAJIB pakai emoji ekspresi/emotion di dalam teks (😂😭😤🤯🤔😱💀🔥👀🤝)
- TOTAL: 5-8 emoji per tweet (campuran: 3-4 emotion + 2-3 topik/simbol)
- JANGAN cuma emoji simbol doang — harus ada emoji yang nunjukin PERASAAN
- Contoh emotion emoji bagus: "😭", "😤", "🤯", "😂", "💀", "😱", "🤔", "😏", "🥲", "😩"
- Jangan pakai emoji basi: ❌ "✅", "❌", "👉", "👇", "‼️", "💯"
`;

const EYD_RULES = `
⚠️ EYD TITIK & KOMA: WAJIB pakai tanda baca yang benar!
- Setiap akhir kalimat HARUS ada titik (.)
- Koma (,) WAJIB dipakai untuk jeda natural, pemisah klausa, setelah kata sambung ("nah,", "jadi,", "padahal,")
- JANGAN kalimat panjang tanpa koma — pecah dengan koma biar ritme enak
- Contoh benar: "Gue udah coba, hasilnya lumayan. Tapi ya gitu, masih ada kurangnya."
`;

// ---- EMOJI MANDATORY RULES ----
// Diterapkan ke SEMUA model & SEMUA fungsi generate

const EMOJI_RULES = `
🎯 EMOJI + EMOTION MANDATORY — WAJIB 100%:
- Karakter PERTAMA dari SELURUH tweet HARUS emoji (sebelum kata apapun)
- AWAL SETIAP PARAGRAF HARUS emoji (setelah line break, karakter pertama = emoji)
- Minimal 5-7 emoji per tweet, tersebar natural di dalam teks
- WAJIB CAMPUR: 3-4 emoji EMOTION/EKSPRESI + 2-3 emoji simbol
- Emoji EMOTION yang WAJIB dipakai: 😂😭😤🤯🤔😱💀🔥😏🥲😩👀
- Emoji harus RELEVAN dengan isi:
  🤔 untuk pertanyaan/bingung, 💡 untuk insight/ide, 🔥 untuk hot take/semangat
  😂 untuk lucu, 💀 untuk dark humor/savage, 😭 untuk curhat/sedih
  😤 untuk kesel/frustrasi, 🤯 untuk mindblown, 👀 untuk perhatian
  😏 untuk sly/sinis, 🥲 untuk bittersweet, 😩 untuk capek/pasrah
- JANGAN mulai tweet dengan kata — HARUS emoji dulu
- JANGAN pakai emoji basi: ✅ ❌ 👉 👇 ‼️ 💯

✅ CONTOH BENAR:
"🤯 Gila sih, gue baru tau AI bisa bantu nulis se-produktif ini.

😤 Awalnya gue skeptis bnget, mikirnya paling cuma gimmick doang. Tapi setelah 3 bulan pake beneran, hasilnya bikin melongo.

😂 Yang biasanya kerjaan 3 hari, sekarang kelar sejam. Goklok emang teknologi sekarang."

❌ CONTOH SALAH (jangan ditiru):
"Gue pernah ngerasa otak lo blank pas mau nulis 🤔. Gue juga dulu gitu, bro.

💡 Masalahnya bukan skill, tapi kebiasaan."
(KENAPA SALAH: paragraf pertama ga diawali emoji)
`;

// ---- Generate Single Post ----

export async function generateContent(opts: { topic?: string; language?: string; tone?: string }) {
  const { topic = 'general', language = 'id' } = opts;
  const key = getActiveApiKey();
  if (!key) return { content: '⚠️ Belum ada API key aktif. Tambahkan di tab Settings.', emoji_count: 0, topic, provider: 'none' };

  const langName = language === 'id' ? 'Indonesia' : 'English';
  const langCasual = language === 'id'
    ? 'Bahasa Indonesia NATURAL — kayak ngobrol di tongkrongan. Pakai "gue/aku", slang: "btw", "jujurly", "banget", "sih", "goklok", "bnget". JANGAN FORMAL. Bukan bahasa berita.'
    : 'Casual conversational English — like DMing a friend. Not textbook.';

  const prompt = `Kamu PENULIS TWITTER ASLI — bukan bot. Tulisanmu harus 100% seperti manusia ngetweet natural.

BUATKAN SATU TWEET — ${langName}.
TOPIK: ${topic}
${langCasual}

❌ ANTI-BOT BLACKLIST:
Jangan mulai dengan: "Tahukah kamu", "Menariknya", "Di era modern", "Halo semuanya", "Tentu saja"
Jangan akhiri dengan: "Semoga bermanfaat!", "Terima kasih!", "Salam sukses!", "Sekian."
Jangan pakai: "menarik untuk dicermati", "patut kita apresiasi", "dapat disimpulkan"

✅ WAJIB:
- HOOK pembuka natural: pertanyaan, hot take, pengakuan, observasi
- POV personal: "gue/aku" bukan "kita/para ahli"
- Kalimat bervariasi: pendek → panjang → pendek
- 2-3 paragraf dengan LINE BREAK
- ~50-70 kata per tweet (MINIMAL 50 KATA, jangan pendek)
- EYD: pakai titik di akhir kalimat, koma untuk jeda
- Kata sambung: "nah", "jadi gini", "masalahnya", "padahal", "btw"
${EMOJI_RULES}
${language === 'id' ? EYD_RULES : ''}
${language === 'id' ? TYPO_RULES : ''}

TULIS TWEET-NYA — INGAT: karakter pertama HARUS emoji, setiap paragraf diawali emoji:`;

  try {
    const result = await callAI({
      provider: key.provider, apiKey: key.api_key, model: key.model,
      prompt, maxTokens: 600, temperature: 0.8,
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

// ---- Generate Ideas ----

const TONE_INSTRUCTION: Record<string, string> = {
  supportif: `Gaya SUPPORTIF — positif, membangun. Jangan lebay. Tetap kasual.
EMOJI WAJIB untuk tone ini: 🥲 ✨ 🤝 💪 🌱 💡 😊 🌟
EMOTION WAJIB: 🥲 (bittersweet), 😊 (hangat), 🤝 (solidaritas)`,
  debate: `Gaya DEBATE — provokatif intelektual, mengundang diskusi. Contrarian tapi well-reasoned.
EMOJI WAJIB untuk tone ini: 🤔 🔥 👀 💀 😏 🧠 ⚡ 🎯
EMOTION WAJIB: 🤔 (mempertanyakan), 😏 (sly/sinis), 💀 (savage)`,
  'kritik-pedas': `Gaya KRITIK PEDAS — tajam, blak-blakan, roastery tapi SMART. Bukan marah-marah.
EMOJI WAJIB untuk tone ini: 😤 💀 😭 🤯 😂 🔥 🗿 ☠️
EMOTION WAJIB: 😤 (kesel), 💀 (dark/savage), 😂 (nyindir), 🤯 (mindblown)`,
};

export async function generateIdeas(opts: { idea: string; language?: string; tone?: string; count?: number }) {
  const { idea, language = 'id', tone = 'supportif', count = 5 } = opts;
  const key = getActiveApiKey();
  if (!key) return { ideas: [] as GeneratedIdea[], provider: 'none' };

  const langName = language === 'id' ? 'Indonesia' : 'English';
  const langCasual = language === 'id'
    ? 'Bahasa Indonesia NATURAL — kayak ngobrol. Pakai "gue/aku", slang OK, boleh ada TYPO dikit ("goklok", "bnget", "yg").'
    : 'Casual conversational English, not textbook.';
  const maxCount = Math.min(count, 10);

  const prompt = `Kamu PENULIS TWITTER ASLI — bukan bot. BUATKAN ${maxCount} VARIASI TWEET tentang: "${idea}"

BAHASA: ${langName}
${langCasual}
${TONE_INSTRUCTION[tone] || ''}

❌ ANTI-BOT: Jangan mulai dengan "Tahukah kamu", "Di era modern", "Halo semua". Jangan akhiri "Semoga bermanfaat!", "Salam sukses!"
✅ WAJIB: Personal POV, kalimat bervariasi, 2-3 paragraf, ~50-70 kata
✅ EYD: titik di akhir kalimat, koma untuk jeda natural
${EMOJI_RULES}
${language === 'id' ? TYPO_RULES : ''}
${language === 'id' ? EYD_RULES : ''}
FORMAT OUTPUT:
---IDEA 1---
[tweet]
---END---
---IDEA 2---
[tweet]
---END---

GENERATE — ingat: karakter pertama = emoji, tiap paragraf = emoji, WAJIB emotion emoji sesuai tone:`;

  try {
    const result = await callAI({
      provider: key.provider, apiKey: key.api_key, model: key.model,
      prompt, maxTokens: maxCount * 500, temperature: 0.9,
    });

    const blocks = result.content.split(/---IDEA \d+---/).filter(Boolean);
    const ideas: GeneratedIdea[] = [];
    for (let i = 0; i < blocks.length && ideas.length < maxCount; i++) {
      let c = blocks[i].replace(/---END---/, '').trim();
      if (c && c.length > 20) {
        c = postProcess(c);
        ideas.push({ id: ideas.length + 1, content: c, emoji_count: (c.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length, tone, language });
      }
    }
    return { ideas, provider: result.provider };
  } catch (e: any) {
    return { ideas: [] as GeneratedIdea[], provider: 'error' };
  }
}
