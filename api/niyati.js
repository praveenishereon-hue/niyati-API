// api/niyati.js — Stable Node Serverless (CORS + clear errors)
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const prompt = (req.body && req.body.prompt) || "";
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN env" });

    const MODEL = "google/gemma-2b-it";

    const r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        Authorization: Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs:
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
सिर्फ़ हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।

प्रश्न: ${prompt}
उत्तर:`
      })
    });

    const raw = await r.text();
    let generated = "";
    try {
      const data = JSON.parse(raw);
      generated = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    } catch {
      generated = raw || "";
    }

    if (!r.ok) {
      return res.status(502).json({ error: "HF error", detail: generated });
    }

    let text = generated || "";
    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Internal error" });
  }
}
