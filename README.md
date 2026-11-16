# 🤖 Twitter AI Agent v4 — X Algorithm 2026 Optimized

> AI-powered viral tweet generator. Built for the X (Twitter) Algorithm 2026.

![Version](https://img.shields.io/badge/version-4.0.0-blue) ![Stack](https://img.shields.io/badge/stack-Vite%20%2B%20React%20%2B%20TypeScript-purple) ![AI](https://img.shields.io/badge/AI-Multi--Provider-green)

## 🎯 What It Does

Generate viral-ready tweets optimized for the **X Algorithm 2026** — not generic AI slop. Every tweet is crafted with:

- **8 Hook Types** — Hot takes, surprising stats, contrarian opinions, personal confessions, rants, and more
- **Reply Bait Strategy** — End every tweet with questions that spark conversation (the +75 signal)
- **Anti-Bot Filter** — Post-processing removes robotic phrases, adds natural paragraph spacing
- **Multi-Tone Support** — Supportif, Debate, Kritik Pedas (each with tone-specific emoji guidelines)
- **Multi-Provider** — CrowLLM (free model catalogue), OpenRouter, OpenAI, Gemini, Groq, Xingchi AI, Custom API

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

### CrowLLM Free Models

CrowLLM uses the OpenAI-compatible base URL `https://crowllm.com/v1`. Add your CrowLLM key in **API Providers → CrowLLM**, then click **Sinkronkan model free**.

Before synchronization, Settings shows the 14 curated IDs below as unverified candidates. After synchronization, only IDs visible to the supplied API key and verified by the Vercel proxy are selectable for saving/testing. The proxy reads account-visible IDs from `GET /v1/models`, checks the curated 14 first, then up to 8 additional candidates to stay within the Vercel function runtime. A `:free` model with an OpenAI-compatible endpoint is verified directly from that API catalogue; detail pages are optional enrichment and are never required, because CrowLLM may protect them with Cloudflare. Embedding, reranking, speech, and other non-chat models are excluded.

These 14 curated models are highlighted with ★ when they are available to the supplied key and expose an OpenAI-compatible endpoint: `agnes-2.5-flash:free`, `grok-4.7-fast:free`, `gemini-3.8-flash:free`, `qwen3-8-omni-flash:free`, `beam-1.0:free`, `caw/glm-5.3-flash:free`, `crouton-alpha:free`, `crow-code-limitless:free`, `crow-uncensored:free`, `crow/auto:free`, `minimax-m3.1-flash:free`, `muse-spark-1.1:free`, `nvidia/nemotron-3.5-bolt-e4b:free`, and `deepseek-v4.1-flash-uncensored:free`. `crow/auto:free` is an automatic router, not one fixed underlying model. Availability can vary by API key and can change over time.

The CrowLLM connection test sends the prompt `Reply with the single word: ready.` through the Vercel proxy to CrowLLM's `POST /v1/chat/completions` endpoint.

CrowLLM describes the Free tier limit as a handful of calls per minute; it does not publish an exact per-model RPM in the public catalog. Check the current [pricing page](https://crowllm.com/pricing) and each model page before relying on free-tier throughput.

For each verified chat model, Settings also displays its 24-hour success rate and average latency using CrowLLM's live [status page](https://crowllm.com/status), with the model detail page as a fallback when the status table has no row. Models are sorted with healthier, faster models first. "No data" means CrowLLM did not publish a usable metric for that model; it is not a claim that the model is offline.

Model discovery and chat completions both go through the same-origin Vercel function (`/api/crowllm`) to avoid browser CORS failures. The proxy forwards requests to CrowLLM and does not log API keys.

**Deployment note:** Redeploy the latest `main` branch on Vercel so the updated `/api/crowllm` serverless function is available. The browser sends the key to your own Vercel deployment, which forwards it to CrowLLM over HTTPS; keep the Vercel project and browser session trusted.


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
