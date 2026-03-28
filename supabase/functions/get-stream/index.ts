const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";

  // ---------------------------------------------------------
  // 1. CHANGE THIS TO YOUR BLOG NAME
  // Example: If your blog is "mysports123.blogspot.com", 
  // just put "mysports123"
  const myBlogName = "https://siditest.blogspot.com"; 
  // ---------------------------------------------------------

  // Check if your blog name is in the link asking for the video
  const isAllowed = origin.includes(myBlogName) || referer.includes(myBlogName);

  // Security Gate: If someone tries to open the link directly, they get Access Denied.
  if (!isAllowed && req.method !== 'OPTIONS') {
    return new Response("Access Denied: This stream is private.", { 
      status: 403, 
      headers: { ...corsHeaders, "Access-Control-Allow-Origin": "*" } 
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin || "*" } 
    });
  }

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    
    const apiHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    const apiRes = await fetch(`https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`, { headers: apiHeaders });
    const data = await apiRes.json();
    const m3u8Url = data?.streams?.hls;

    if (!m3u8Url) return new Response("Not Found", { status: 404 });

    const streamRes = await fetch(m3u8Url, { headers: apiHeaders });
    let manifest = await streamRes.text();
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    manifest = manifest.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifest, {
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
})
