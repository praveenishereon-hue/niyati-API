// api/niyati.js — CommonJS version (Vercel Node) + robust JSON replies
module.exports = async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // --- Safe JSON body parse (req.body ना भी हो) ---
  async function readJsonBody(req) {
    try {
      if (req.body && typeof req.body === "object") return req.body;
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString("utf8");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  try {
    const body = await readJsonBody(req);
    const prompt = body && body.prompt ? String(body.prompt) : "";
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN env" });

    const MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // चाहो तो बाद में बदल सकते हैं

    // --- HF call with timeout ---
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 30000);
    let r, raw;
    try {
      r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
        method: "POST",
        headers: {
          Authorization: Bearer ${HF_TOKEN},
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs:
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
सिर्फ हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।
प्रश्न: ${prompt}
उत्तर:`
        }),
        signal: controller.signal
      });
      raw = await r.text();
    } catch (e) {
      clearTimeout(to);
      return res.status(502).json({ error: "HF fetch failed", detail: String(e) });
    }
    clearTimeout(to);

    if (!r.ok) {
      return res.status(502).json({ error: "HF error", detail: raw });
    }

    let text = "";
    try {
      const data = JSON.parse(raw);
      text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    } catch {
      text = raw || "";
    }

    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
    if (!text) {
      text = "आज धैर्य रखें; प्रयासों के साथ दिन बेहतर बनेगा, शाम के समय शुभ संकेत मिलेंगे।";
    }

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
};
