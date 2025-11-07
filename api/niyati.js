// api/niyati.js  — Vercel Serverless Function (CommonJS, Node 18)

const MODEL = "google/gemma-2b-it";

// छोटे helper: safe JSON body पढ़ना
function readBody(req) {
  return new Promise((resolve) => {
    try {
      if (req.body && typeof req.body === "object") return resolve(req.body);
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        try { resolve(JSON.parse(raw || "{}")); }
        catch { resolve({}); }
      });
    } catch {
      resolve({});
    }
  });
}

module.exports = async (req, res) => {
  // CORS headers (preflight सहित)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // body
  const body = await readBody(req);
  const prompt = (body && body.prompt) || "";
  if (!prompt) return res.status(400).json({ error: "No prompt" });

  // token
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN" });

  // Hugging Face call
  const resp = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
    method: "POST",
    headers: {
      "Authorization": Bearer ${HF_TOKEN},
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs:
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
केवल हिंदी में 3–5 छोटी वाक्यों में उत्तर दें।
प्रश्न: ${prompt}
उत्तर:`
    })
  });

  const raw = await resp.text();
  if (!resp.ok) {
    return res.status(502).json({ error: "HF error", detail: raw });
  }

  // कुछ मॉडेल टेक्स्ट/एरे दोनों तरह लौटाते हैं — safe parsing
  let out = "";
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      out = data[0]?.generated_text || data[0]?.summary_text || "";
    } else if (data && typeof data === "object") {
      out = data.generated_text || data.summary_text || "";
    }
  } catch {
    out = raw;
  }

  if (out.includes("उत्तर:")) out = out.split("उत्तर:").pop().trim();
  out = (out || "").trim();

  return res.status(200).json({ text: out || "उत्तर उपलब्ध नहीं है।" });
};
