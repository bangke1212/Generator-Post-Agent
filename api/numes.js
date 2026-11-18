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
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upstream error';
    return res.status(502).json({
      error: {
        message: `Gagal menghubungi server Numes dari backend Vercel: ${message}`,
      },
    });
  }
}
