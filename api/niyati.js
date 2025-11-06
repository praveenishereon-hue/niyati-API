// api/niyati.js — Edge Function (CORS solid)
export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default async function handler(req) {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: CORS
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt || "";
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt" }), {
        status: 400,
        headers: CORS
      });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    const MODEL = "google/gemma-2b-it";

    const r = await fetch(https://api-inference.huggingface.co/models/${MODEL}, {
      method: "POST",
      headers: {
        Authorization: Bearer ${HF_TOKEN},
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs:
`आप एक अनुभवी भारतीय वैदिक ज्योतिषी हैं।
केवल हिंदी में, 3–5 छोटी पंक्तियों में उत्तर दें।

प्रश्न: ${prompt}
उत्तर:`
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "HF error", detail: t }), {
        status: 502,
        headers: CORS
      });
    }

    const data = await r.json();
    let text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) || "";
    if (text.includes("उत्तर:")) text = text.split("उत्तर:").pop().trim();

    return new Response(JSON.stringify({ text }), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: CORS
    });
  }
}
