// Niyati API — Vercel Serverless (Node 18+, native fetch)
export default async function handler(req, res) {
  // ---- CORS ----
  const reqHeaders = req.headers["access-control-request-headers"] || "content-type";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", reqHeaders);
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // GET पर simple OK (health check)
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "Send POST with JSON { prompt: '...' }" });
  }

  // ---- Safe JSON body parse ----
  let body = {};
  try {
    if (req.body && typeof req.body === "object") {
      body = req.body;
    } else {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    }
  } catch {
    body = {};
  }

  const prompt = body?.prompt ? String(body.prompt) : "";
  if (!prompt) return res.status(400).json({ error: "No prompt" });

  // ---- Hugging Face call ----
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN" });

  // छोटा/fast मॉडल; जरूरत हो तो बदल सकते हैं
  const MODEL = "google/gemma-2b-it"; // alt: "mistralai/Mistral-7B-Instruct-v0.2"

  const userPrompt =
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
सिर्फ हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।
प्रश्न: ${prompt}
उत्तर:`;

  // Timeout guard (25s)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  let hfRes, raw;
  try {
    hfRes = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        "Authorization": Bearer ${HF_TOKEN},
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: userPrompt }),
      signal: controller.signal
    });
    raw = await hfRes.text();
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") return res.status(504).json({ error: "HF timeout" });
    return res.status(502).json({ error: "HF fetch failed", detail: String(e) });
  } finally {
    clearTimeout(timer);
  }

  if (!hfRes.ok) {
    // HF अक्सर plain text में भी error देता है—उसी को लौटा दें
    return res.status(502).json({ error: "HF error", detail: raw });
  }

  // ---- Parse HF response robustly ----
  let text = "";
  try {
    const data = JSON.parse(raw);
    text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
  } catch {
    // कुछ models raw text देते हैं
    text = raw || "";
  }

  if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
  if (!text) text = "आज धैर्य रखें; प्रयासों से शुभ परिणाम मिलेंगे।";

  return res.status(200).json({ text });
}
