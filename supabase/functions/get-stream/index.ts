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
    
    // 1. Setup headers exactly like a real browser
    const commonHeaders = new Headers();
    commonHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    commonHeaders.set("Referer", "https://www.aloula.sa/");
    commonHeaders.set("Origin", "https://www.aloula.sa");

    // 2. Get the fresh stream link
    const apiRes = await fetch(`https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`, { 
      headers: commonHeaders 
    });
    const data = await apiRes.json();
    const m3u8Url = data?.streams?.hls;

    if (!m3u8Url) return new Response("Stream Not Found", { status: 404, headers: corsHeaders });

    // 3. Proxy the .m3u8 file content
    const streamRes = await fetch(m3u8Url, { headers: commonHeaders });
    let manifest = await streamRes.text();

    // 4. FIX: Turn relative links into absolute links
    // This ensures segments (.ts files) point back to the original server
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    manifest = manifest.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifest, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store" // Force fresh link every time
      }
    });

  } catch (e) {
    return new Response("Proxy Error", { status: 500, headers: corsHeaders });
  }
})
