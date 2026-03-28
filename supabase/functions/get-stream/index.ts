const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // Handle CORS for the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    
    // 1. Get the actual .m3u8 link from Aloula
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;
    const commonHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://www.aloula.sa/",
      "Origin": "https://www.aloula.sa"
    };

    const apiRes = await fetch(targetApi, { headers: commonHeaders });
    const data = await apiRes.json();
    const realM3u8Url = data?.streams?.hls;

    if (!realM3u8Url) return new Response("Channel Not Found", { status: 404, headers: corsHeaders });

    // 2. Fetch the content of the .m3u8 file
    const streamRes = await fetch(realM3u8Url, { headers: commonHeaders });
    let manifestText = await streamRes.text();

    /** * 3. CRITICAL FIX: Manifest Rewriting
     * Standard M3U8 files use relative paths (like "chunk1.ts"). 
     * We must change them to absolute paths so Shaka knows they belong to Aloula, not Supabase.
     */
    const baseUrl = realM3u8Url.substring(0, realM3u8Url.lastIndexOf('/') + 1);
    
    // This line finds any link that doesn't start with "http" or "#" and adds the Base URL to it
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
