// Same-origin proxy for CrowLLM. Keeps browser CORS out of the request path.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { action, apiKey, model, prompt, maxTokens, temperature } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: { message: 'API Key CrowLLM belum diisi.' } });
  }

  const isModels = action === 'models';
  if (!isModels && action !== 'chat') {
    return res.status(400).json({ error: { message: 'Action CrowLLM tidak valid.' } });
  }
  if (!isModels && (typeof model !== 'string' || !model.trim())) {
    return res.status(400).json({ error: { message: 'Model CrowLLM belum dipilih.' } });
  }

  const url = isModels
    ? 'https://crowllm.com/v1/models'
    : 'https://crowllm.com/v1/chat/completions';

  try {
    const upstream = await fetch(url, {
      method: isModels ? 'GET' : 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        ...(isModels ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(isModels ? {} : {
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: String(prompt || 'Test koneksi — reply dengan OK saja') }],
          max_tokens: Number.isFinite(maxTokens) ? maxTokens : 512,
          temperature: Number.isFinite(temperature) ? temperature : 0.7,
          stream: false,
        }),
      }),
      signal: AbortSignal.timeout(isModels ? 20000 : 60000),
    });

    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upstream error';
    return res.status(502).json({
      error: {
        message: `Backend Vercel gagal menghubungi CrowLLM: ${message}. Coba lagi atau periksa status CrowLLM.`,
      },
    });
  }
}
