const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    
    // Improved ID detection: Works for /get-stream/9 OR /get-stream?id=9
    const pathParts = url.pathname.split('/');
    const lastPart = pathParts.pop() || '';
    const channelId = (lastPart && !isNaN(Number(lastPart))) 
      ? lastPart 
      : (url.searchParams.get('id') || '9');
    
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    // Perform the fetch
    const res = await fetch(targetApi, { headers });
    
    if (!res.ok) {
        return new Response(`Aloula API Error: ${res.status}`, { status: res.status, headers: corsHeaders });
    }

    const data = await res.json();
    const m3u8 = data?.streams?.hls;

    if (!m3u8) {
      return new Response("M3U8 link not found in API response", { status: 404, headers: corsHeaders });
    }

    // Return the link as plain text
    return new Response(m3u8, {
      headers: { 
        ...corsHeaders,
        "Content-Type": "text/plain" 
      }
    });

  } catch (e) {
    // This will now tell us EXACTLY what went wrong
    return new Response(`Worker Error: ${e.message}`, { status: 500, headers: corsHeaders });
  }
})
