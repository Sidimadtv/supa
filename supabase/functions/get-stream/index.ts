const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // Handle CORS Preflight (Browser check)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    
    const apiHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    // 1. Get the fresh stream link from Aloula
    const apiRes = await fetch(`https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`, { headers: apiHeaders });
    const data = await apiRes.json();
    const m3u8Url = data?.streams?.hls;

    if (!m3u8Url) return new Response("Not Found", { status: 404, headers: corsHeaders });

    // 2. Fetch the video manifest (the .m3u8 content)
    const streamRes = await fetch(m3u8Url, { headers: apiHeaders });
    let manifest = await streamRes.text();

    // 3. Fix the internal links so the player can find the video segments
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    manifest = manifest.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifest, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
})
