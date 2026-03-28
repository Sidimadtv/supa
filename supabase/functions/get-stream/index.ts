const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";

  // 1. SMART KEYWORD CHECK
  // Looking for 'siditest' anywhere in the address
  const myBlogName = "siditest"; 

  // Check if it's your blog
  const isAllowed = origin.toLowerCase().includes(myBlogName) || 
                    referer.toLowerCase().includes(myBlogName);

  // 2. SECURITY GATE
  if (!isAllowed && req.method !== 'OPTIONS') {
    // This logs what headers are actually arriving so you can see them in Supabase Logs
    console.log(`Blocked! Origin: ${origin}, Referer: ${referer}`);
    return new Response("Access Denied: Private Stream", { 
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
