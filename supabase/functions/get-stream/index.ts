// Define CORS headers so your website can talk to Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req: Request) => {
  // 1. Handle browser pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    // Get ID from query parameter: ?id=9
    const channelId = url.searchParams.get('id') || '9';
    
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
    
    // Use the exact headers that work in your Cloudflare script
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    const res = await fetch(targetApi, { headers });
    const data = await res.json();
    const m3u8 = data?.streams?.hls;

    if (!m3u8) {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }

    // Return the link as plain text
    return new Response(m3u8, {
      headers: { 
        ...corsHeaders,
        "Content-Type": "text/plain" 
      }
    });

  } catch (err) {
    return new Response(String(err), { status: 500, headers: corsHeaders });
  }
})
