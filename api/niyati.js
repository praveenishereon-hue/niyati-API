// api/niyati.js  (CommonJS)

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  // CORS headers हर रिस्पॉन्स पर
  setCORS(res);

  // Preflight (OPTIONS) — तुरंत 204 भेज दो
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // सिर्फ POST allow
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN" });

    const MODEL = "google/gemma-2b-it";

    // Vercel के Node रनटाइम में fetch पहले से मौजूद है
    const r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        "Authorization": Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs:
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
केवल हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।

प्रश्न: ${prompt}
उत्तर:`
      })
    });

    const raw = await r.text();

    // HF कभी raw text भी दे देता है—पहले JSON ट्राय करो, नहीं बने तो raw लौटा दो
    let data;
    try { data = JSON.parse(raw); } catch { 
      return res.status(r.ok ? 200 : 502).send(raw);
    }

    let text = Array.isArray(data) ? (data[0]?.generated_text || "") 
                                   : (data?.generated_text || "");
    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();

    return res.status(200).json({ text });
  } catch (e) {
    // error में भी CORS बना रहे
    setCORS(res);
    return res.status(500).json({ error: e.message });
  }
};
