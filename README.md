# 🤖 Twitter AI Agent v4 — X Algorithm 2026 Optimized

> AI-powered viral tweet generator. Built for the X (Twitter) Algorithm 2026.

![Version](https://img.shields.io/badge/version-4.0.0-blue) ![Stack](https://img.shields.io/badge/stack-Vite%20%2B%20React%20%2B%20TypeScript-purple) ![AI](https://img.shields.io/badge/AI-Multi--Provider-green)

## 🎯 What It Does

Generate viral-ready tweets optimized for the **X Algorithm 2026** — not generic AI slop. Every tweet is crafted with:

- **8 Hook Types** — Hot takes, surprising stats, contrarian opinions, personal confessions, rants, and more
- **Reply Bait Strategy** — End every tweet with questions that spark conversation (the +75 signal)
- **Anti-Bot Filter** — Post-processing removes robotic phrases, adds natural paragraph spacing
- **Multi-Tone Support** — Supportif, Debate, Kritik Pedas (each with tone-specific emoji guidelines)
- **Multi-Provider** — OpenRouter (free models), OpenAI, Gemini, Groq, Agnes AI, Custom API

## 🧠 Why This Matters (X Algorithm 2026)

The X algorithm changed significantly in late 2025. Here's what matters now:

| Signal | Weight | Strategy |
|--------|--------|----------|
| **Reply + Author Reply** | **+75** | End tweets with open questions |
| Like | +0.5 | Don't optimize for this |
| Retweet | +1.0 | Side effect, not goal |
| Dwell Time (2+ min) | +10 | Thread-style, paragraph spacing |
| Profile Visits | +12 | Build curiosity |

**Penalized:** 3+ hashtags, links in main tweet, engagement bait ("RT if you agree")

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## ⚙️ Setup API Keys

1. Open the app → **API Keys** tab
2. Choose a provider (OpenRouter recommended — free models available)
3. Paste your API key
4. Click **Simpan & Aktifkan** then **Test Koneksi**

### Recommended Free Models (via OpenRouter):
- `google/gemini-2.0-flash-001` — Best free model
- `meta-llama/llama-3.3-70b-instruct` — Great for Indonesian
- `deepseek/deepseek-r1-distill-llama-70b` — Deep reasoning

## 📁 Project Structure

```
src/
├── App.tsx              # Router & layout
├── gemini.ts            # AI prompt engine (X 2026 optimized)
├── providers.ts         # Multi-provider AI configuration
├── store.ts             # LocalStorage-based data store
├── components/
│   └── Header.tsx       # Navigation header
└── pages/
    ├── Ideas.tsx        # Multi-variant idea generator
    ├── Generate.tsx     # Single tweet generator
    └── Settings.tsx     # API key management
```

## 🔥 Viral Tweet Formula (Built into Prompts)

1. **Hook first** — 8 hook types, randomly chosen per generation
2. **Emoji mandatory** — First character of every tweet & every paragraph starts with emoji
3. **Personal POV** — "gue/aku" not "kita/para ahli"
4. **Paragraph rhythm** — Short → long → short sentences
5. **Reply bait** — Always end with open-ended question or call-to-reply
6. **Anti-bot** — No "Tahukah kamu", "Semoga bermanfaat!", "Di era modern"

## 🛠 Tech Stack

- **Vite** — Build tool
- **React 18** — UI framework
- **TypeScript** — Type safety
- **TailwindCSS** — Styling
- **OpenAI SDK** — AI provider interface
- **React Router** — Client-side routing

## 📝 License

MIT

---

Built with ❤️ for the X algorithm era.
