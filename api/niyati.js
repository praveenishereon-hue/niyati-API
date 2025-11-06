// api/niyati.js  — CommonJS, full CORS + robust body + HF call (Node 18+ has global fetch)

const HF_MODEL = "google/gemma-2b-it";

function setCORS(res) {
  // चाहो तो "*" की जगह अपने frontend origin डाल सकते हो
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { resolve({}); }
    });
  });
}

module.exports = async function handler(req, res) {
  setCORS(res);

  // Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Health check (GET)
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, note: "Send POST with JSON { prompt: '...' }" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const body = (req.body && typeof req.body === "object") ? req.body : await readJsonBody(req);
    const prompt = (body && typeof body.prompt === "string") ? body.prompt.trim() : "";
    if (!prompt) return res.status(400).json({ error: "No prompt" });

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return res.status(500).json({ error: "Missing HF_TOKEN env" });

    const instr =
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
केवल हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।

प्रश्न: ${prompt}
उत्तर:`;

    const r = await fetch(https://api-inference.huggingface.co/models/${HF_MODEL}, {
      method: "POST",
      headers: {
        "Authorization": Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: instr })
    });

    const raw = await r.text();

    if (!r.ok) {
      // HF की तरफ का error भी CORS सहित JSON में लौटाओ
      setCORS(res);
      return res.status(502).json({ error: "HF error", detail: raw });
    }

    // HF response parse (array/object/raw किसी भी रूप में)
    let text = "";
    try {
      const data = JSON.parse(raw);
      text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    } catch {
      text = raw || "";
    }

    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();
    if (!text) text = "आज धैर्य रखें; प्रयासों से शुभ परिणाम मिलेंगे।";

    setCORS(res);
    return res.status(200).json({ text });
  } catch (e) {
    setCORS(res);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
};
