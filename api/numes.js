// Same-origin proxy for Numes AI. Keeps browser CORS out of the request path.
// Numes menolak request browser dari origin pihak ketiga (403 cors_forbidden),
// jadi pemanggilan langsung dari frontend tidak bisa — harus lewat fungsi ini.
// Numes adalah marketplace inference OpenAI-compatible:
// https://api.numes.ai/api/v1 — model dipakai lewat model ID apa adanya.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { apiKey, model, prompt, imageData, videoUrl, mediaType, maxTokens, temperature } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: { message: 'API Key Numes belum diisi.' } });
  }
  if (typeof model !== 'string' || !model.trim()) {
    return res.status(400).json({ error: { message: 'Model Numes belum dipilih.' } });
  }

  try {
    const upstream = await fetch('https://api.numes.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        // Cloudflare di depan api.numes.ai memblokir request server-side
        // tanpa User-Agent browser (HTTP 520). Pakai UA browser agar
        // request tidak dianggap bot.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: (typeof imageData === 'string' && imageData.startsWith('data:image/')) || (typeof videoUrl === 'string' && /^https?:\/\//i.test(videoUrl))
            ? [
                ...(typeof imageData === 'string' && imageData.startsWith('data:image/') ? [{ type: 'image_url', image_url: { url: imageData } }] : []),
                ...(typeof videoUrl === 'string' && /^https?:\/\//i.test(videoUrl)
                  ? [mediaType === 'image' ? { type: 'image_url', image_url: { url: videoUrl } } : { type: 'video_url', video_url: { url: videoUrl } }]
                  : []),
                { type: 'text', text: String(prompt || 'Analisis media ini dan jawab dengan ringkas.') },
              ]
            : String(prompt || 'Test koneksi — reply dengan OK saja'),
        }],
        max_tokens: Number.isFinite(maxTokens) ? maxTokens : 512,
        temperature: Number.isFinite(temperature) ? temperature : 0.7,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    const body = await upstream.text();
    // Kalau upstream mengembalikan JSON (sukses atau error API yang valid),
    // teruskan apa adanya beserta statusnya.
    let parsed = null;
    try { parsed = JSON.parse(body); } catch { /* bukan JSON */ }
    if (parsed !== null) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(upstream.status).send(body);
    }
    // Upstream mengembalikan bukan-JSON (mis. halaman error HTML Cloudflare
    // saat request diblokir). Jangan teruskan mentah-mentah — frontend gagal
    // JSON.parse dan pesannya jadi membingungkan. Kembalikan error JSON jelas.
    return res.status(502).json({
      error: {
        message: `Numes mengembalikan respons tidak valid (HTTP ${upstream.status}). Server Numes/Cloudflare menolak request dari backend Vercel — kemungkinan diblokir sebagai bot. Coba lagi nanti.`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upstream error';
    return res.status(502).json({
      error: {
        message: `Gagal menghubungi server Numes dari backend Vercel: ${message}`,
      },
    });
  }
}
