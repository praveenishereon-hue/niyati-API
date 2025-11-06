// api/niyati.js — Stable Node Serverless + Clear Logs (HuggingFace)
// ---------------------------------------------------------------
// NOTE: Vercel Project Settings → Environment Variables:
// Key: HF_TOKEN , Value: your Hugging Face token (starts with "hf_")

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    // --- Body / Prompt ---
    const prompt = (req.body && req.body.prompt) ? String(req.body.prompt) : "";
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    // --- Env / Model ---
    const HF_TOKEN = process.env.HF_TOKEN;
    const MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // more reliable

    // Debug logs (Vercel → Logs में दिखेंगे)
    console.log("🧠 Prompt:", prompt);
    console.log("🔑 HF_TOKEN exists:", !!HF_TOKEN);
    console.log("📦 MODEL:", MODEL);

    if (!HF_TOKEN) {
      return res.status(500).json({ error: "Missing HF_TOKEN env" });
    }

    // --- HF Inference Call (simple inputs) ---
    const r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        Authorization: Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // सादा input भेज रहे हैं ताकि पहले कनेक्शन पक्का हो
        inputs: `आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
केवल हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।
प्रश्न: ${prompt}
उत्तर:`
      })
    });

    // --- Read raw text first (कुछ मॉडेल्स array/obj दोनों दे देते हैं) ---
    const raw = await r.text();

    // Bad status? show HF response as detail
    if (!r.ok) {
      return res.status(502).json({ error: "HF error", detail: raw });
    }

    // Try to parse; accept both array/object shapes
    let text = "";
    try {
      const data = JSON.parse(raw);
      text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    } catch {
      text = raw || "";
    }

    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
    if (!text) text = "आज धैर्य रखें; छोटे कार्य पूरे होंगे और संध्या के बाद स्थिति बेहतर होगी।";

    return res.status(200).json({ text });
  } catch (e) {
    console.error("❌ API crash:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
