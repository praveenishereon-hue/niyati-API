// api/niyati.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const HF_TOKEN = process.env.HF_TOKEN;
    const MODEL = "google/gemma-2b-it";

    const r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        "Authorization": Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: आप एक अनुभवी भारतीय ज्योतिषी हैं। कृपया हिंदी में 3–4 पंक्तियों में जवाब दें:\n\nप्रश्न: ${prompt}\nउत्तर:
      })
    });

    const data = await r.json();
    let text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
