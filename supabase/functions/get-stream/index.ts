const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  // 1. Get the "ID Card" of the person asking for the video
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";

  // 2. YOUR ALLOWED LIST
  // Put your exact Blogger URLs here
  const allowedBlogs = [
    "https://siditest.blogspot.com",
    "https://your-second-blog.blogspot.com"
  ];

  // Check if the request comes from your blogs
  const isAllowed = allowedBlogs.some(blog => 
    origin.startsWith(blog) || referer.startsWith(blog)
  );

  // 3. SECURITY GATE: If not on the list, block them immediately
  if (!isAllowed && req.method !== 'OPTIONS') {
    return new Response("Access Denied: This stream is private.", { 
      status: 403, 
      headers: { ...corsHeaders, "Access-Control-Allow-Origin": "*" } 
    });
  }

  // Handle CORS for the allowed browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin } 
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

    // Get the fresh stream link
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
        "Access-Control-Allow-Origin": origin,
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
})
