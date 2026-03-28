const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    const res = await fetch(targetApi, { headers });
    const data = await res.json();
    const m3u8 = data?.streams?.hls;

    if (!m3u8) return new Response("Channel Not Found", { status: 404, headers: corsHeaders });

    return new Response(m3u8, {
      headers: { ...corsHeaders, "Content-Type": "application/vnd.apple.mpegurl" }
    });
  } catch (e) {
    return new Response("Worker Error", { status: 500, headers: corsHeaders });
  }
})
