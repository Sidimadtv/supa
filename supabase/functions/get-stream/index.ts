const corsHeaders = {
  // Replace with your actual Blogger URL
  'Access-Control-Allow-Origin': 'https://siditest.blogspot.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || req.headers.get("Referer");

  // 1. SECURITY CHECK: If the request is NOT from your Blogger, block it!
  // This stops people from opening the link directly or putting it on other sites.
  if (origin && !origin.includes("siditest.blogspot.com')) {
    return new Response("Access Denied: This stream is locked to my Blogger.", { 
      status: 403, 
      headers: corsHeaders 
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    
    const apiHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    // Get fresh link from Aloula
    const apiRes = await fetch(`https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`, { headers: apiHeaders });
    const data = await apiRes.json();
    const m3u8Url = data?.streams?.hls;

    if (!m3u8Url) return new Response("Not Found", { status: 404, headers: corsHeaders });

    // Fetch and Rewrite the manifest
    const streamRes = await fetch(m3u8Url, { headers: apiHeaders });
    let manifest = await streamRes.text();
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    manifest = manifest.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifest, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.mpegurl"
      }
    });
  } catch (e) {
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
})
