const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // 1. Handle browser pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    // Get ID from path or query. This works for both: /get-stream/9 OR /get-stream?id=9
    const pathId = url.pathname.split('/').pop();
    const queryId = url.searchParams.get('id');
    const channelId = queryId || pathId || '9';

    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;

    // We use a Headers object to ensure Deno accepts the restricted names
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

    // Return the text link just like your Cloudflare worker did
    return new Response(m3u8, {
      headers: { 
        ...corsHeaders,
        "Content-Type": "text/plain" 
      }
    });

  } catch (e) {
    console.error(e);
    return new Response("Worker Error", { status: 500, headers: corsHeaders });
  }
})
