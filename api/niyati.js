// api/niyati.js  (CommonJS)

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ ok: true, note: "Send POST with JSON { prompt: '...' }" });
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN" });

    const MODEL = "google/gemma-2b-it";

    const r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        "Authorization": Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs:
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
केवल हिंदी में 3–5 छोटी पंक्तियों में जवाब दें।

प्रश्न: ${prompt}
उत्तर:`
      })
    });

    const textBody = await r.text();  // कभी-कभी HF plain text या error देता है
    let out = "";
    try {
      const data = JSON.parse(textBody);
      out = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    } catch {
      out = textBody; // JSON न हो तो raw text
    }
    if (!r.ok) return res.status(502).json({ error: "HF error", detail: out });

    if (out.includes("उत्तर:")) out = out.split("उत्तर:").pop().trim();
    return res.status(200).json({ text: out.trim() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
