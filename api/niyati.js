// Minimal test handler — no HF call
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  // GET पर 200 देकर बताएँ कि फ़ंक्शन जिंदा है
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, note: "Send POST with JSON { prompt: '...' }" });
  }

  // सुरक्षित तरीके से JSON body पढ़ो
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

  return res.status(200).json({ ok: true, got: body });
}
