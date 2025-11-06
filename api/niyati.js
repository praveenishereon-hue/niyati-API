import fetch from "node-fetch";

// Vercel Serverless API (ESM). Requires package.json: { "type":"module" }
export default async function handler(req, res) {
  // ----- CORS (preflight first) -----
  const reqHeaders = req.headers["access-control-request-headers"] || "*";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Vary",
    "Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", reqHeaders);
    return res.status(204).end(); // preflight OK
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // ----- Safe JSON body read -----
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

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN" });

  const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

  // ----- Call Hugging Face Inference -----
  let hfRes, raw;
  try {
    hfRes = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        Authorization: Bearer ${HF_TOKEN},
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
सिर्फ हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।
प्रश्न: ${prompt}
उत्तर:`,
      }),
    });
    raw = await hfRes.text();
  } catch (e) {
    return res.status(502).json({ error: "HF fetch failed", detail: String(e) });
  }

  if (!hfRes.ok) {
    return res.status(502).json({ error: "HF error", detail: raw });
  }

  // ----- Parse HF response -----
  let text = "";
  try {
    const data = JSON.parse(raw);
    text =
      (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) ||
      "";
  } catch {
    text = raw || "";
  }

  if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
  if (!text) {
    text =
      "आज धैर्य रखें; प्रयासों के साथ दिन बेहतर बनेगा, शाम को शुभ संकेत मिल सकते हैं।";
  }

  return res.status(200).json({ text });
}
