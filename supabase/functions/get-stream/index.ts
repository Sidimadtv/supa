Deno.serve(async (req) => {
  // 1. Get the headers from the browser
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  const userAgent = req.headers.get("user-agent") || "";

  // 2. THE SMART ALLOW LIST
  // Just put the unique part of your blog names here (no https://)
  const myBlogNames = ["https://siditest.blogspot.com", "yourblogname2"];

  // Check if either the Origin or Referer contains your blog name
  const isAllowed = myBlogNames.some(name => 
    origin.includes(name) || referer.includes(name)
  );

  // 3. THE "SUPER-LOCK" Logic
  // If it's NOT your blog, AND it's not a pre-flight request, BLOCK IT.
  if (!isAllowed && req.method !== 'OPTIONS') {
    console.log(`Blocked Access from: Origin: ${origin}, Referer: ${referer}`);
    return new Response("Access Denied: This stream is private.", { 
      status: 403, 
      headers: { "Access-Control-Allow-Origin": "*" } 
    });
  }

  // --- REST OF YOUR CODE (API FETCH) GOES HERE ---
  // Make sure to use "origin" in the Access-Control-Allow-Origin header below
