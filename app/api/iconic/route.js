// app/api/iconic/route.js
// Vercel API proxy: injects token, handles CORS, provides fallback.
// Browser never calls Apps Script directly.

const APPS_SCRIPT_URL = process.env.ICONIC_APPS_SCRIPT_URL;
const API_TOKEN       = process.env.ICONIC_API_TOKEN ||
  'c989972c78d921901187b21e754ba7b54d6e39b02b58e9ba3c57dcbd2413c24c';

// Endpoints that can be cached briefly
const CACHEABLE = new Set(['bootstrap', 'analytics', 'insights', 'projects', 'critical', 'milestones']);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'bootstrap';

  if (!APPS_SCRIPT_URL) {
    console.warn('[iconic] ICONIC_APPS_SCRIPT_URL not set — returning fallback');
    return Response.json(getFallbackPayload(endpoint), {
      headers: corsHeaders()
    });
  }

  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('endpoint', endpoint);
    url.searchParams.set('token', API_TOKEN);

    // Forward extra params (project, status filters, etc.)
    searchParams.forEach((val, key) => {
      if (key !== 'endpoint') url.searchParams.set(key, val);
    });

    const fetchOptions = {
      headers: { 'Content-Type': 'application/json' },
    };

    // Next.js fetch cache
    if (CACHEABLE.has(endpoint)) {
      fetchOptions.next = { revalidate: 300 }; // 5 minutes
    } else {
      fetchOptions.cache = 'no-store';
    }

    const upstream = await fetch(url.toString(), fetchOptions);

    if (!upstream.ok) {
      throw new Error(`Upstream HTTP ${upstream.status}`);
    }

    const data = await upstream.json();

    const cacheControl = CACHEABLE.has(endpoint)
      ? 'public, s-maxage=300, stale-while-revalidate=60'
      : 'no-cache, no-store';

    return Response.json(data, {
      headers: { ...corsHeaders(), 'Cache-Control': cacheControl }
    });

  } catch (err) {
    console.error('[iconic] proxy error:', err.message);
    return Response.json(
      { error: err.message, fallback: true, ...getFallbackPayload(endpoint) },
      { status: 200, headers: corsHeaders() } // 200 so client can use fallback
    );
  }
}

export async function POST(request) {
  if (!APPS_SCRIPT_URL) {
    return Response.json(
      { reply: 'AI chat requires Apps Script URL to be configured.', source: 'fallback' },
      { headers: corsHeaders() }
    );
  }

  try {
    const body = await request.json();
    const { endpoint = 'chat', ...payload } = body;

    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('endpoint', endpoint);
    url.searchParams.set('token', API_TOKEN);

    const upstream = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const data = await upstream.json();
    return Response.json(data, { headers: corsHeaders() });

  } catch (err) {
    console.error('[iconic] POST error:', err.message);
    return Response.json(
      { error: err.message, reply: 'Unable to process request. Please try again.', source: 'error' },
      { status: 200, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Minimal fallback when Apps Script is not yet deployed
function getFallbackPayload(endpoint) {
  if (endpoint === 'bootstrap' || endpoint === 'health') {
    return {
      tasks:          [],
      projects:       [],
      criticalPath:   [],
      milestones:     [],
      analytics:      { portfolio: {}, health: {}, projects: {}, owners: {} },
      insights:       { executiveSummary: 'Connect Apps Script to load live data.', interventions: [], criticalPressure: [], ownerOverload: [], riskConcentration: [] },
      lastSync:       '',
      buildVersion:   '2.0.0',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1-OJbL15wuDtzYeq9wObrZU5Le6JEusSVK46BM80UNpo/edit',
      taskCount:      0,
      projectCount:   0,
      diagnostics:    { tasksLoaded: false, appsScriptConfigured: false }
    };
  }
  return {};
}
