// Proxy Text-to-Image untuk Xingchi — mengikuti pola api/xingchi.js (chat).
// Browser tidak memanggil api.xingchiapi.com langsung (CORS), semua lewat fungsi ini.
//
// POST body:
//   { apiKey, action: 'image_models' }                          -> daftar model gambar yang terlihat oleh key
//   { apiKey, action: 'generate_image', model, prompt, size }   -> buat gambar (default action)
//
// Respons generate diteruskan apa adanya dari upstream (OpenAI-compatible):
//   { data: [ { url } | { b64_json, revised_prompt } ] }

const UPSTREAM_BASE = 'https://api.xingchiapi.com/v1';

// Fallback statis: model gambar yang terverifikasi ada di katalog Xingchi (dicek 2026-11-18).
// Dipakai hanya bila pengambilan katalog dinamis gagal.
export const XINGCHI_IMAGE_MODELS = [
  'gpt-image-2.6-flare',
  'gpt-image-2.6-sunburst',
  'gpt-image-2.5-flare',
  'gpt-image-2.5-sunburst',
  'gpt-image-2',
  'gpt-image-1.5',
  'gpt-image-1',
];

function isClientPolicyBlock(body) {
  // Xingchi explicitly blocks requests from scripts, SDKs and third-party chat apps.
  // Surface that policy clearly instead of showing a generic connection failure.
  return /仅支持编程客户端|脚本.{0,12}SDK直连|第三方聊天客户端/.test(body || '');
}

function policyError(res) {
  return res.status(403).json({
    error: {
      code: 'XINGCHI_CLIENT_NOT_SUPPORTED',
      message: 'Xingchi menolak aplikasi Generator Post Agent karena hanya mengizinkan klien pemrograman resminya (mis. Codex, Claude Code, Cursor, Cline). Integrasi aplikasi pihak ketiga seperti ini belum diizinkan oleh Xingchi. Gunakan penyedia API lain di aplikasi ini atau minta Xingchi membuka akses OpenAI-compatible untuk aplikasi pihak ketiga.'
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { apiKey, action, model, prompt, size, n } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: { message: 'API Key Xingchi belum diisi.' } });
  }

  const headers = {
    Authorization: `Bearer ${apiKey.trim()}`,
    'Content-Type': 'application/json',
  };

  try {
    if (action === 'image_models') {
      const upstream = await fetch(`${UPSTREAM_BASE}/models`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000),
      });
      const body = await upstream.text();
      if (isClientPolicyBlock(body)) return policyError(res);
      if (!upstream.ok) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(upstream.status).send(body);
      }
      let parsed;
      try { parsed = JSON.parse(body); } catch { parsed = null; }
      const ids = Array.isArray(parsed?.data) ? parsed.data.map(item => item?.id).filter(id => typeof id === 'string') : [];
      const imageIds = ids.filter(id => /image/i.test(id)).sort();
      const models = (imageIds.length ? imageIds : XINGCHI_IMAGE_MODELS).map(id => ({ id, name: id }));
      return res.status(200).json({ models, source: imageIds.length ? 'catalog' : 'fallback' });
    }

    // Default: generate_image
    if (typeof model !== 'string' || !model.trim()) {
      return res.status(400).json({ error: { message: 'Model gambar Xingchi belum dipilih.' } });
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: { message: 'Prompt gambar belum diisi.' } });
    }

    const upstream = await fetch(`${UPSTREAM_BASE}/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.trim(),
        prompt: prompt.trim(),
        size: typeof size === 'string' && /^\d+x\d+$/.test(size) ? size : '1024x1024',
        n: Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), 4) : 1,
      }),
      // Pembuatan gambar bisa lambat; beri waktu lebih panjang dari chat (60s).
      signal: AbortSignal.timeout(120000),
    });

    const body = await upstream.text();
    if (isClientPolicyBlock(body)) return policyError(res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upstream error';
    return res.status(502).json({
      error: {
        message: `Gagal menghubungi server Xingchi dari backend Vercel: ${message}`,
      },
    });
  }
}
