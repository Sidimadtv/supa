const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

Deno.serve(async (req) => {
  // 1. Handle browser pre-flight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const channelId = url.searchParams.get('id') || '9';
    const targetApi = `https://aloula.faulio.com/api/v1.1/channels/${channelId}/player`;

    // TRICK: We MUST use new Headers() and .set() for Deno to allow Referer/Origin
    const customHeaders = new Headers();
    customHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    customHeaders.set("Referer", "https://www.aloula.sa/");
    customHeaders.set("Origin", "https://www.aloula.sa");

    // Get the stream link from Aloula
    const apiRes = await fetch(targetApi, { headers: customHeaders });
    const data = await apiRes.json();
    const realM3u8Url = data?.streams?.hls;

    if (!realM3u8Url) return new Response("Not Found", { status: 404, headers: corsHeaders });

    // 2. Fetch the .m3u8 content and FIX it
    const streamRes = await fetch(realM3u8Url, { headers: customHeaders });
    let manifestText = await streamRes.text();

    // Fix relative links (e.g., 'segment1.ts' -> 'https://server.com/segment1.ts')
    const baseUrl = realM3u8Url.substring(0, realM3u8Url.lastIndexOf('/') + 1);
    manifestText = manifestText.replace(/^(?!http|#)(.*)$/gm, `${baseUrl}$1`);

    return new Response(manifestText, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.apple.mpegurl"
      }
    });

  } catch (e) {
    return new Response("Error: " + e.message, { status: 500, headers: corsHeaders });
  }
})
