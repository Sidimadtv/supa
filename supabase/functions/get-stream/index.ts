const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    
    // 1. Fetch a FRESH link from the API
    const apiHeaders = new Headers();
    apiHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    apiHeaders.set("Referer", "https://www.aloula.sa/");
    apiHeaders.set("Origin", "https://www.aloula.sa");

    const apiRes = await fetch(`https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`, { 
      headers: apiHeaders 
    });
    
    const data = await apiRes.json();
    const m3u8Url = data?.streams?.hls;

    if (!m3u8Url) return new Response("Stream Not Found", { status: 404, headers: corsHeaders });

    // 2. Fetch the actual playlist content
    const streamRes = await fetch(m3u8Url, { headers: apiHeaders });
    let manifest = await streamRes.text();

    // 3. Fix the segment links so they don't break
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    manifest = manifest.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifest, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache" // Tell the browser NOT to save the old expired link
      }
    });
  } catch (e) {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
})
