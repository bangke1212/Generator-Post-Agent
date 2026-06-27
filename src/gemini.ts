// AI Content Generator — Vite SPA, calls AI provider directly
// Optimized for X (Twitter) Algorithm 2026 — Reply-driven viral strategy

import { callAI, PROVIDER_PRESETS } from './providers';
import { getActiveApiKey, getSetting } from './store';

export interface GeneratedIdea {
  id: number;
  content: string;
  emoji_count: number;
  tone: string;
  language: string;
  hook_type?: string;
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

// ============================================================
//  PROMPT ENGINE v4 — X Algorithm 2026 Optimized
//  Key signals: Reply-chains (+75), Dwell time (+10),
//  Early velocity (30min), Conversation quality
//  Penalized: 3+ hashtags, links in main tweet, engagement bait
// ============================================================

const VIRAL_HOOK_STRATEGY = `
🎯 X ALGORITHM 2026 — VIRAL HOOK STRATEGY:

Kamu HARUS mulai tweet dengan salah satu dari 8 tipe hook viral ini (pilih secara acak, jangan monoton):

1. HOT TAKE: Opini kontroversial yang bikin orang berdebat
   Contoh: "🔥 Stop glorifying hustle culture. It's literally killing your creativity."
   
2. SURPRISING STAT: Data mengejutkan yang bikin orang bookmark
   Contoh: "📊 93% startup gagal bukan karena produk jelek, tapi karena founder-nya gak bisa jualan."

3. RELATABLE OBSERVATION: Observasi kecil yang bikin orang "wah gue banget"
   Contoh: "😭 Kenapa setiap coffee shop sekarang playlist-nya tiga lagu itu mulu sih"

4. CONTRARIAN TAKE: Lawan arus opini mainstream
   Contoh: "🤯 Unpopular opinion: kuliah 4 tahun itu scam terbesar gen Z."

5. PERSONAL CONFESSION: Pengakuan personal yang vulnerable
   Contoh: "🥲 Jujur, gue dulu income $0 selama 8 bulan pertama bikin startup."

6. QUESTION HOOK: Pertanyaan yang memancing reply
   Contoh: "🤔 Genuine question: kalo AI udah bisa ngoding, frontend dev ngapain 5 tahun lagi?"

7. BEFORE/AFTER: Transformasi dramatis
   Contoh: "💀 2023: gue hopeless, burnout, mau quit. 2025: $15k/month solo founder."

8. RANT / MINI-ROAST: Keluhan relatable yang entertaining
   Contoh: "😤 Hiring itu skill tersendiri. Dan 90% HR di Indonesia GAK PUNYA skill itu."
`;

const ALGO_REPLY_BAIT = `
💬 REPLY BAIT STRATEGY — X Algorithm 2026:

X memberi bobot reply +75 (150x dari like +0.5). Jadi SETIAP tweet HARUS memancing reply!

CARA MEMANCING REPLY:
- Akhiri tweet dengan PERTANYAAN TERBUKA yang gampang dijawab
  "Ada yang pernah ngalamin juga?", "Menurut kalian gimana?", "Setuju gak?"
- Sisakan RUANG KONTROVERSI — jangan terlalu "selesai", biarkan orang menambahkan
- Pakai CALL-TO-REPLY natural di paragraf terakhir
  "Drop your take di reply 👇", "Spill pengalaman lu di bawah"
- BUAT LISTICLE pendek: "Top 3 hal yang..." — orang akan menambahkan #4, #5
- JANGAN tutup dengan kesimpulan final — biarkan TERBUKA untuk debat
`;

const EMOJI_RULES = `
🎯 EMOJI + EMOTION MANDATORY — WAJIB 100% (X 2026 Algorithm):

Algoritma X 2026 menggunakan NLP semantic, bukan hashtag. Emoji justru membantu:
- Karakter PERTAMA tweet HARUS emoji (stop scroll, naikkan dwell time)
- AWAL SETIAP PARAGRAF HARUS emoji (visual break = dwell time naik)
- Minimal 5-7 emoji per tweet, tersebar natural
- WAJIB CAMPUR: 3-4 emoji EMOTION + 2-3 emoji SIMBOL
- Emoji EMOTION wajib: 😂😭😤🤯🤔😱💀🔥😏🥲😩👀
- Emoji HARUS RELEVAN dengan isi:
  🤔 pertanyaan/bingung, 💡 insight/ide, 🔥 hot take/semangat
  😂 lucu, 💀 dark humor/savage, 😭 curhat/sedih
  😤 kesel/frustrasi, 🤯 mindblown, 👀 perhatian
  😏 sly/sinis, 🥲 bittersweet, 😩 capek/pasrah
- JANGAN pakai emoji basi: ✅ ❌ 👉 👇 ‼️ 💯

✅ CONTOH BENAR:
"🤯 Gila sih, gue baru tau AI bisa bantu productivity se-liar ini.

😤 Awalnya skeptis bnget. Mikirnya cuma gimmick doang. Tapi 3 bulan pake beneran?

😂 Kerjaan 3 hari kelar sejam. Goklok emang teknologi sekarang. Ada yang udah nyoba juga?"

❌ CONTOH SALAH (jangan ditiru):
"Gue pernah ngerasa stuck pas mau nulis. Gue juga dulu gitu, bro.
💡 Masalahnya bukan skill, tapi kebiasaan."
(KENAPA SALAH: paragraf pertama ga diawali emoji, gak ada reply bait di akhir)
`;

const TYPO_RULES = `
⚠️ NATURAL — SLANG & GAUL (ID only):

Masukkan 1-2 kata gaul/slang ALAMI per paragraf:
- "goklok", "bnget", "gue", "lu", "anjay", "bacot", "ngpain", "gitu", "yaelah", "wkwk", "njir"
- Singkatan natural: "yg", "gak", "dgn", "krn", "ato", "tp", "dr", "pdhl"
JANGAN OVERDO — maks 2-3 slang per TWEET. Kalimat pertama HARUS BERSIH.
`;

const EYD_RULES = `
⚠️ EYD TITIK & KOMA — WAJIB:

- Setiap akhir kalimat HARUS titik (.)
- Koma (,) WAJIB untuk jeda natural, pemisah klausa, setelah kata sambung
- JANGAN kalimat panjang tanpa koma — pecah biar ritme enak
`;

const ALGO_ANTI_PENALTY = `
🚫 X ALGORITHM 2026 — HAL YANG DIPENALTI (JANGAN LAKUKAN):

❌ JANGAN pakai 3+ hashtag — trigger spam filter, reach turun drastis
❌ JANGAN taruh link di main tweet — reach turun ~50%. Link taruh di reply
❌ JANGAN engagement bait blatant: "RT jika setuju", "Like kalau relate", "Tag 3 temen"
❌ JANGAN mulai dengan kata-kata basi: "Tahukah kamu", "Di era", "Halo semua"
❌ JANGAN akhiri dengan: "Semoga bermanfaat!", "Sekian.", "Terima kasih!"
✅ BOLEH 0-1 hashtag branded/nama doang jika sangat perlu
✅ BOLEH reply bait natural: "menurut lu gimana?" (bukan "RT jika setuju!")
`;

// ---- Generate Single Post (X 2026 Optimized) ----

export async function generateContent(opts: { topic?: string; language?: string; tone?: string }) {
  const { topic = 'general', language = 'id' } = opts;
  const key = getActiveApiKey();
  if (!key) return { content: '⚠️ Belum ada API key aktif. Tambahkan di tab Settings.', emoji_count: 0, topic, provider: 'none' };

  const langName = language === 'id' ? 'Indonesia' : 'English';
  const langCasual = language === 'id'
    ? 'Bahasa Indonesia NATURAL — kayak ngobrol di tongkrongan. Pakai "gue/aku", slang: "btw", "jujurly", "banget", "sih", "goklok", "bnget". JANGAN FORMAL. Bukan bahasa berita.'
    : 'Casual conversational English — like DMing a friend. Not textbook. Not LinkedIn.';

  const prompt = `Kamu PENULIS TWITTER VIRAL — spesialis X algorithm 2026. Tulisanmu 100% natural seperti manusia beneran, bukan bot.

BUATKAN SATU TWEET — ${langName}.
TOPIK: ${topic}
${langCasual}

${VIRAL_HOOK_STRATEGY}

${ALGO_REPLY_BAIT}

${EMOJI_RULES}

${language === 'id' ? EYD_RULES : ''}
${language === 'id' ? TYPO_RULES : ''}

${ALGO_ANTI_PENALTY}

✅ FORMAT TWEET YANG BENAR:
- Hook KUAT di baris pertama (pakai emoji)
- 2-3 paragraf dengan LINE BREAK
- Setiap paragraf mulai dengan EMOJI
- ~70-100 kata (jangan terlalu pendek, dwell time penting)
- Akhiri dengan PERTANYAAN atau CALL-TO-REPLY natural
- POV personal: "gue/aku" bukan "kita/para ahli"
- Kalimat bervariasi: pendek → panjang → pendek
- EYD: titik di akhir kalimat, koma untuk jeda

TULIS TWEET-NYA SEKARANG:`;

  try {
    const result = await callAI({
      provider: key.provider, apiKey: key.api_key, model: key.model,
      prompt, maxTokens: 700, temperature: 0.85,
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

// ---- TONE INSTRUCTIONS (X 2026 — reply-driven) ----

const TONE_INSTRUCTION: Record<string, string> = {
  supportif: `Gaya SUPPORTIF — positif & membangun, tapi tetap ada EDGE biar gak boring.
Emoji tone: 🥲 ✨ 🤝 💪 🌱 💡 😊 🌟
Emotion wajib: 🥲 (bittersweet), 😊 (hangat), 🤝 (solidaritas)
Reply bait: "Ada yang lagi fase ini juga?", "Spill journey lo di reply 👇"`,
  debate: `Gaya DEBATE — provokatif intelektual, contrarian tapi well-reasoned. Ini format TERKUAT di X 2026 (reply-chain +75).
Emoji tone: 🤔 🔥 👀 💀 😏 🧠 ⚡ 🎯
Emotion wajib: 🤔 (mempertanyakan), 😏 (sly/sinis), 💀 (savage)
Reply bait: "Change my mind.", "Debat di reply, gue tunggu.", "Unpopular opinion, but..."`,
  'kritik-pedas': `Gaya KRITIK PEDAS — tajam, blak-blakan, roastery tapi SMART. Format ini VIRAL BANGET di 2026 karena memancing reply-chain.
Emoji tone: 😤 💀 😭 🤯 😂 🔥 🗿 ☠️
Emotion wajib: 😤 (kesel), 💀 (dark/savage), 😂 (nyindir), 🤯 (mindblown)
Reply bait: "Siapa yang relate angkat tangan.", "Yang tersinggung berarti kena.", "Kasih argumen lu di reply."`,
};

// ---- Generate Ideas (X 2026 — multi-variant reply-bait) ----

export async function generateIdeas(opts: { idea: string; language?: string; tone?: string; count?: number }) {
  const { idea, language = 'id', tone = 'supportif', count = 5 } = opts;
  const key = getActiveApiKey();
  if (!key) return { ideas: [] as GeneratedIdea[], provider: 'none' };

  const langName = language === 'id' ? 'Indonesia' : 'English';
  const langCasual = language === 'id'
    ? 'Bahasa Indonesia NATURAL — kayak ngobrol. Pakai "gue/aku", slang OK, boleh ada TYPO dikit ("goklok", "bnget", "yg").'
    : 'Casual conversational English, not textbook.';
  const maxCount = Math.min(count, 10);

  const prompt = `Kamu PENULIS TWITTER VIRAL — spesialis X algorithm 2026. BUATKAN ${maxCount} VARIASI TWEET tentang: "${idea}"

BAHASA: ${langName}
${langCasual}

${TONE_INSTRUCTION[tone] || ''}

${VIRAL_HOOK_STRATEGY}

${ALGO_REPLY_BAIT}

${EMOJI_RULES}

${language === 'id' ? EYD_RULES : ''}
${language === 'id' ? TYPO_RULES : ''}

${ALGO_ANTI_PENALTY}

✅ SETIAP VARIASI HARUS:
- Hook type BERBEDA (jangan semua hot take atau semua question hook)
- Akhiri dengan REPLY BAIT berbeda
- ~70-100 kata, 2-3 paragraf
- ~6-8 emoji per tweet
- Personal POV

FORMAT OUTPUT (WAJIB):
---IDEA 1---
HOOK_TYPE: [sebutkan tipe hook-nya]
[tweet lengkap dengan emoji dan reply bait]
---END---
---IDEA 2---
HOOK_TYPE: [sebutkan tipe hook-nya]
[tweet lengkap]
---END---

GENERATE ${maxCount} VARIASI:`;

  try {
    const result = await callAI({
      provider: key.provider, apiKey: key.api_key, model: key.model,
      prompt, maxTokens: maxCount * 600, temperature: 0.9,
    });

    const blocks = result.content.split(/---IDEA \d+---/).filter(Boolean);
    const ideas: GeneratedIdea[] = [];
    for (let i = 0; i < blocks.length && ideas.length < maxCount; i++) {
      let block = blocks[i].replace(/---END---/, '').trim();
      // Extract HOOK_TYPE if present
      let hook_type: string | undefined;
      if (block.startsWith('HOOK_TYPE:')) {
        const lines = block.split('\n');
        hook_type = lines[0].replace('HOOK_TYPE:', '').trim();
        block = lines.slice(1).join('\n').trim();
      }
      if (block && block.length > 20) {
        block = postProcess(block);
        ideas.push({
          id: ideas.length + 1,
          content: block,
          emoji_count: (block.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length,
          tone,
          language,
          hook_type,
        });
      }
    }
    return { ideas, provider: result.provider };
  } catch (e: any) {
    return { ideas: [] as GeneratedIdea[], provider: 'error' };
  }
}
