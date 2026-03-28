const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    
    /** * 2. FIXED ID DETECTION
     * In Supabase, the path is: /functions/v1/get-stream/9
     * This code looks at the very last part of the URL for the ID.
     */
    const pathParts = url.pathname.split('/');
    const channelId = pathParts[pathParts.length - 1] || '9';
    
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
    
    // 3. Exact headers from your Cloudflare code
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    const res = await fetch(targetApi, { headers });
    const data = await apiRes.json();
    const m3u8 = data?.streams?.hls;

    if (!m3u8) {
      return new Response("Channel Not Found", { status: 404, headers: corsHeaders });
    }

    // 4. Return the text link exactly like Cloudflare
    return new Response(m3u8, {
      headers: { 
        ...corsHeaders,
        "Content-Type": "text/plain" 
      }
    });

  } catch (e) {
    return new Response("Worker Error", { status: 500, headers: corsHeaders });
  }
})
