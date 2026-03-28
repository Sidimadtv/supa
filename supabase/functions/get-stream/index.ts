const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const channelId = url.searchParams.get('id') || '9';
  
  // 1. Get the actual stream URL from Aloula
  const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
  const apiHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Referer": "https://www.aloula.sa/",
    "Origin": "https://www.aloula.sa"
  };

  try {
    const apiRes = await fetch(targetApi, { headers: apiHeaders });
    const data = await apiRes.json();
    const m3u8Url = data?.streams?.hls;

    if (!m3u8Url) return new Response("Not Found", { status: 404 });

    // 2. Proxy the actual M3U8 content
    const streamRes = await fetch(m3u8Url, { headers: apiHeaders });
    let manifestText = await streamRes.text();

    // 3. Fix relative links in the manifest (Crucial for Shaka)
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    manifestText = manifestText.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifestText, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.mpegurl"
      }
    });
  } catch (e) {
    return new Response("Proxy Error", { status: 500, headers: corsHeaders });
  }
})
