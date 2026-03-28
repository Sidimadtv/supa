Deno.serve(async (req) => {
  // 1. Get the headers from the browser
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";

  // 2. SET YOUR ONLY ALLOWED BLOG HERE
  // Replace this with your actual Blogger URL
  const myOnlyBlog = "hhttps://siditest.blogspot.com";

  // Check if the request is coming from your blog
  const isAllowed = origin.startsWith(myOnlyBlog) || referer.startsWith(myOnlyBlog);

  // 3. Strict CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : myOnlyBlog,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  // 4. The Security Gate: Block anyone who isn't you
  if (!isAllowed && req.method !== 'OPTIONS') {
    return new Response("Access Denied: This stream is for my blog only.", { 
      status: 403, 
      headers: { ...corsHeaders, "Access-Control-Allow-Origin": "*" } 
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

    if (!m3u8Url) return new Response("Not Found", { status: 404 });

    // Fetch and fix the manifest
    const streamRes = await fetch(m3u8Url, { headers: apiHeaders });
    let manifest = await streamRes.text();
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
    return new Response("Error", { status: 500 });
  }
})
