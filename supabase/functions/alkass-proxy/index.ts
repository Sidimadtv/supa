import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const url = new URL(req.url);
  // This captures the actual .m3u8 link you put after ?url=
  const target = url.searchParams.get("url");

  // 1. Basic Status Check (If you visit the link directly)
  if (!target) {
    return new Response("S!D!M@D PRO-ALKASS: STATUS ONLINE", { 
        status: 200, 
        headers: { "Content-Type": "text/plain" } 
    });
  }

  try {
    // 2. The "Handshake" with Alkass Servers
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.alkass.net/',
        'Origin': 'https://www.alkass.net'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    
    // 3. M3U8 Rewriting (The "Sidi-Logic")
    // If the response is a playlist, we must rewrite the links inside it
    // so the video segments (.ts) also go through this Supabase proxy.
    if (contentType.includes('mpegurl') || target.includes('.m3u8')) {
      let text = await response.text();
      const baseUrl = new URL(target);
      
      text = text.replace(/^(?!#)(.+)$/gm, (line) => {
        const absolute = new URL(line.trim(), baseUrl).toString();
        // This wraps every segment link back into your Supabase function
        return `${url.origin}${url.pathname}?url=${encodeURIComponent(absolute)}`;
      });

      return new Response(text, {
        headers: { 
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*" // Allows your Blogger site to read the data
        }
      });
    }

    // 4. Binary Streaming
    // This handles the actual video chunks (.ts files)
    return new Response(response.body, {
      headers: { 
        "Content-Type": contentType, 
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (e) {
    return new Response("Sidi-Proxy Error: " + e.message, { status: 500 });
  }
})
