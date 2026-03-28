const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // Handle CORS for browser players
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
    
    // TRICK: We use a custom Headers object and 'set' to bypass Deno's restriction
    const headers = new Headers();
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    headers.set("Referer", "https://www.aloula.sa/");
    headers.set("Origin", "https://www.aloula.sa");

    const res = await fetch(targetApi, { 
      method: 'GET',
      headers: headers 
    });

    const data = await res.json();
    const m3u8 = data?.streams?.hls;

    if (!m3u8) {
      return new Response("Channel Not Found", { status: 404, headers: corsHeaders });
    }

    // Return the text link exactly like your Cloudflare worker
    return new Response(m3u8, {
      headers: { 
        ...corsHeaders,
        "Content-Type": "text/plain" 
      }
    });

  } catch (e) {
    return new Response("Worker Error: " + e.message, { status: 500, headers: corsHeaders });
  }
})
