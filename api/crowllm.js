// Same-origin proxy for CrowLLM. Keeps browser CORS out of the request path.
const CROWLLM = 'https://crowllm.com';
export const config = { maxDuration: 30 };

function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function htmlText(html) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function zeroPrice(text, label) {
  const match = text.match(new RegExp(label + '\\s*\\$?\\s*([0-9]+(?:\\.[0-9]+)?)', 'i'));
  return !!match && Number(match[1]) === 0;
}

function zeroMetadataPrice(value) {
  if (typeof value === 'number') return value === 0;
  if (typeof value === 'string') return value.trim() !== '' && Number(value) === 0;
  return false;
}

function hasZeroPricingMetadata(item) {
  const pricing = item?.pricing || item;
  const pairs = [
    [pricing?.input, pricing?.output],
    [pricing?.prompt, pricing?.completion],
    [pricing?.input_price, pricing?.output_price],
    [pricing?.inputPrice, pricing?.outputPrice],
  ];
  return pairs.some(([input, output]) => zeroMetadataPrice(input) && zeroMetadataPrice(output));
}

const CURATED_MODEL_IDS = [
  'agnes-2.5-flash:free',
  'beam-1.0:free',
  'caw/glm-5.3-flash:free',
  'crouton-alpha:free',
  'crow-code-limitless:free',
  'crow-uncensored:free',
  'crow/auto:free',
  'minimax-m3.1-flash:free',
  'muse-spark-1.1:free',
  'nvidia/nemotron-3.5-bolt-e4b:free',
  'deepseek-v4.1-flash-uncensored:free',
];
const CURATED_MODEL_ID_SET = new Set(CURATED_MODEL_IDS);
const CATALOG_TIMEOUT_MS = 7000;
const STATUS_TIMEOUT_MS = 2500;
const MODEL_PAGE_TIMEOUT_MS = 3500;
const MODEL_PAGE_FALLBACK_TIMEOUT_MS = 1500;
const MODEL_PAGE_CONCURRENCY = 8;
const MAX_EXTRA_MODEL_CANDIDATES = 8;

function isTimeoutError(error) {
  const message = String(error?.message || error || '');
  return error?.name === 'TimeoutError' || error?.name === 'AbortError'
    || /timed? ?out|aborted due to timeout/i.test(message);
}

function parseMetrics(html, modelId, modelIds = []) {
  const text = htmlText(html);
  const index = text.toLowerCase().indexOf(modelId.toLowerCase());
  if (index < 0) {
    return { status: 'no_data', successRate: null, averageLatencyMs: null, requests24h: null };
  }
  const nextModelPositions = modelIds
    .filter(id => id !== modelId)
    .map(id => text.toLowerCase().indexOf(id.toLowerCase(), index + modelId.length))
    .filter(position => position >= 0);
  const rowEnd = nextModelPositions.length ? Math.min(...nextModelPositions) : index + 2200;
  const context = text.slice(Math.max(0, index - 300), Math.min(text.length, rowEnd));
  const successMatch = context.match(/(?:success rate|served within 24 hours)(?:\s*\(24h\))?[^0-9]{0,70}([0-9]+(?:\.[0-9]+)?)\s*%/i);
  const latencyMatch = context.match(/(?:average latency|whole response time|latency)(?:\s*\(24h\))?[^0-9]{0,70}([0-9][0-9,]*(?:\.[0-9]+)?)\s*(ms|msec|s|sec|seconds)\b/i);
  const requestsMatch = context.match(/requests?\s*(?:\(24h\))?[^0-9]{0,30}([0-9,]+)/i);
  let averageLatencyMs = null;
  if (latencyMatch) {
    averageLatencyMs = Number(latencyMatch[1].replace(/,/g, '')) * (/^(s|sec|seconds)$/i.test(latencyMatch[2] || '') ? 1000 : 1);
  }
  const successRate = successMatch ? Number(successMatch[1]) : null;
  let status = 'no_data';
  if (successRate !== null) {
    status = successRate >= 95 ? 'healthy' : successRate >= 80 ? 'degraded' : 'unstable';
  } else if (/not serving|outage/i.test(context)) {
    status = 'unavailable';
  }
  return {
    status,
    successRate,
    averageLatencyMs,
    requests24h: requestsMatch ? Number(requestsMatch[1].replace(/,/g, '')) : null,
  };
}

async function fetchText(url, timeoutMs = 18000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
  if (!response.ok) throw new Error('CrowLLM returned HTTP ' + response.status + ' for ' + url);
  return response.text();
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      try { results[index] = await mapper(items[index]); }
      catch { results[index] = null; }
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchModelPage(id) {
  const pathId = id.split('/').map(encodeURIComponent).join('/');
  try {
    return { id, html: await fetchText(CROWLLM + '/models/' + pathId, MODEL_PAGE_TIMEOUT_MS), timedOut: false };
  } catch (error) {
    if (isTimeoutError(error)) return { id, html: '', timedOut: true };
    if (!(error instanceof Error) || !/HTTP 404\b/.test(error.message)) return null;
    try {
      return { id, html: await fetchText(CROWLLM + '/models/' + encodeURIComponent(id), MODEL_PAGE_FALLBACK_TIMEOUT_MS), timedOut: false };
    } catch (fallbackError) {
      return isTimeoutError(fallbackError) ? { id, html: '', timedOut: true } : null;
    }
  }
}

async function getFreeChatModels(apiKey) {
  let response;
  try {
    response = await fetch(CROWLLM + '/v1/models', {
      headers: { Authorization: 'Bearer ' + apiKey },
      signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new Error(`CrowLLM /v1/models timed out after ${CATALOG_TIMEOUT_MS / 1000} seconds.`);
    throw error;
  }
  const payloadText = await response.text();
  let payload;
  try { payload = JSON.parse(payloadText); }
  catch { throw new Error('CrowLLM /v1/models returned invalid JSON.'); }
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'CrowLLM models request failed (HTTP ' + response.status + ').');
  }

  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const ids = [...new Set(rows.map(item => item?.id).filter(id => typeof id === 'string' && id.trim()))];
  if (!ids.length) return { models: [], partial: false, checkedCandidates: 0, totalCandidates: 0, timedOutModelPages: 0 };

  // :free is only a discovery hint. Each candidate's official model page is checked
  // for zero input/output price AND a chat-completions endpoint before it is shown.
  const allCandidates = [...new Set(rows.filter(item => typeof item?.id === 'string' && (item.id.endsWith(':free') || hasZeroPricingMetadata(item))).map(item => item.id))];
  const available = new Set(allCandidates);
  const orderedCandidates = [
    ...CURATED_MODEL_IDS.filter(id => available.has(id)),
    ...allCandidates.filter(id => !CURATED_MODEL_ID_SET.has(id)),
  ];
  const candidates = orderedCandidates.slice(0, CURATED_MODEL_IDS.length + MAX_EXTRA_MODEL_CANDIDATES);
  if (!candidates.length) return { models: [], partial: false, checkedCandidates: 0, totalCandidates: 0, timedOutModelPages: 0 };
  const curatedCandidates = candidates.filter(id => CURATED_MODEL_ID_SET.has(id));
  const extraCandidates = candidates.filter(id => !CURATED_MODEL_ID_SET.has(id));

  // Check curated IDs first. Bound total work to stay inside Vercel's function runtime.
  const statusPromise = fetchText(CROWLLM + '/status', STATUS_TIMEOUT_MS).catch(() => '');
  const [statusHtml, curatedPages] = await Promise.all([
    statusPromise,
    mapWithConcurrency(curatedCandidates, MODEL_PAGE_CONCURRENCY, fetchModelPage),
  ]);
  const extraPages = await mapWithConcurrency(extraCandidates, MODEL_PAGE_CONCURRENCY, fetchModelPage);
  const detailPages = [...curatedPages, ...extraPages];
  const timedOutModelPages = detailPages.filter(page => page?.timedOut).length;

  const verified = detailPages.filter(page => page && !page.timedOut).map(({ id, html: detailHtml }) => {
    const detailText = htmlText(detailHtml);
    // CrowLLM model pages label the endpoint as 'Endpoints chat'; do not require the URL sample to be present.
    const endpointLabel = detailText.match(/Endpoints\s+([a-z0-9,\s-]{1,120})/i)?.[1] || '';
    const hasChatEndpoint = /\/v1\/chat\/completions/i.test(detailHtml) || /(?:^|\b)chat(?:\b|$)/i.test(endpointLabel);
    const explicitlyFree = zeroPrice(detailText, 'Input') && zeroPrice(detailText, 'Output');
    if (!explicitlyFree || !hasChatEndpoint) return null;

    // Prefer the live status page. Fall back to the official model detail page
    // when the status table does not expose a row for this model.
    let metrics = parseMetrics(statusHtml, id, ids);
    if (metrics.status === 'no_data') metrics = parseMetrics(detailHtml, id);
    return {
      id,
      name: id,
      free: true,
      temperature: 0.82,
      maxTokens: 1400,
      strengths: ['chat'],
      bestFor: 'Verified free CrowLLM chat model.',
      ...metrics,
    };
  });
  const models = verified.filter(Boolean).sort((a, b) => {
    const rank = { healthy: 0, degraded: 1, unstable: 2, unavailable: 3, no_data: 4 };
    return (rank[a.status] ?? 5) - (rank[b.status] ?? 5)
      || (b.successRate ?? -1) - (a.successRate ?? -1)
      || (a.averageLatencyMs ?? Number.MAX_SAFE_INTEGER) - (b.averageLatencyMs ?? Number.MAX_SAFE_INTEGER);
  });
  return {
    models,
    partial: orderedCandidates.length > candidates.length,
    checkedCandidates: candidates.length,
    totalCandidates: orderedCandidates.length,
    timedOutModelPages,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { action, apiKey, model, prompt, maxTokens, temperature } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: { message: 'API Key CrowLLM belum diisi.' } });
  }

  if (action === 'models') {
    try {
      const catalog = await getFreeChatModels(apiKey.trim());
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        ...catalog,
        statusUrl: CROWLLM + '/status',
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CrowLLM error';
      const timedOut = isTimeoutError(error);
      return res.status(timedOut ? 504 : 502).json({
        error: {
          message: timedOut
            ? 'Katalog CrowLLM masih timeout saat mengambil daftar model. Coba sinkronkan lagi beberapa saat.'
            : 'Gagal mengambil katalog CrowLLM: ' + message,
        },
      });
    }
  }

  if (action !== 'chat') {
    return res.status(400).json({ error: { message: 'Action CrowLLM tidak valid.' } });
  }
  if (typeof model !== 'string' || !model.trim()) {
    return res.status(400).json({ error: { message: 'Model CrowLLM belum dipilih.' } });
  }

  try {
    const upstream = await fetch(CROWLLM + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: String(prompt || 'Test koneksi — reply dengan OK saja') }],
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
        message: 'Backend Vercel gagal menghubungi CrowLLM: ' + message + '. Coba lagi atau periksa status CrowLLM.',
      },
    });
  }
}
