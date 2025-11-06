// api/niyati.js  — CommonJS + Full CORS on every path (Vercel Node)

// NOTE: Node 18+ पर fetch() मौजूद है; extra package की ज़रूरत नहीं।
const HF_MODEL = "google/gemma-2b-it";

function setCors(res) {
  // चाहो तो यहाँ अपना frontend origin डाल सकते हो:
  // res.setHeader("Access-Control-Allow-Origin", "https://praveenishereon-hue.github.io");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { prompt } = await readJsonBody(req);
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "No prompt" });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: "Missing HF_TOKEN env" });
    }

    const hfRes = await fetch(
      https://api-inference.huggingface.co/models/${HF_MODEL},
      {
        method: "POST",
        headers: {
          Authorization: Bearer ${HF_TOKEN},
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs:
            `आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं। ` +
            केवल हिंदी में 3–5 छोटी पंक्तियों में उत्तर दें।\n\n +
            प्रश्न: ${prompt}\nउत्तर:,
        }),
      }
    );

    const raw = await hfRes.text();

    if (!hfRes.ok) {
      // HF side error भी CORS सहित लौटाओ
      setCors(res);
      return res.status(502).json({ error: "HF error", detail: raw });
    }

    let out = "";
    try {
      const data = JSON.parse(raw);
      out =
        (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) ||
        "";
      if (out.includes("उत्तर:")) out = out.split("उत्तर:").pop().trim();
    } catch {
      out = raw;
    }

    setCors(res);
    return res.status(200).json({ text: out || "⚠️ कोई उत्तर प्राप्त नहीं हुआ।" });
  } catch (e) {
    setCors(res);
    return res.status(500).json({ error: e.message || "Server error" });
  }
};
