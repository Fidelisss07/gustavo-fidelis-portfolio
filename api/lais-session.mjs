const allowedOrigin = "https://gustavo-fidelis-portfolio.vercel.app";
const agentId = "agent_7001m3jjb6fzfgga66drpdhv3pr2";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (
    req.headers.origin !== allowedOrigin ||
    req.headers.host !== "gustavo-fidelis-portfolio.vercel.app" ||
    !req.headers["content-type"]?.split(";")[0].trim().startsWith("application/json")
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Session unavailable" });

  const mode = new URL(req.url, allowedOrigin).searchParams.get("mode");
  if (mode !== "voice" && mode !== "text")
    return res.status(400).json({ error: "Invalid session mode" });

  const endpoint = mode === "text" ? "get-signed-url" : "token";
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/${endpoint}?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: { "xi-api-key": apiKey },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) return res.status(502).json({ error: "Session unavailable" });
    const result = await response.json();
    const credentials = mode === "text"
      ? { signedUrl: result.signed_url }
      : { conversationToken: result.token };
    if (!Object.values(credentials)[0])
      return res.status(502).json({ error: "Session unavailable" });
    return res.status(200).json(credentials);
  } catch {
    return res.status(502).json({ error: "Session unavailable" });
  }
}
