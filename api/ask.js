export const config = {
 runtime:"nodejs"
 };  

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  // 🔹 SYSTEM PROMPT (CONTENT UNCHANGED)
  const systemPrompt = `
You are MEBI, a friendly AI study buddy for Indian students.

YOUR IDENTITY (VERY IMPORTANT – NEVER BREAK):
- You belong to the SANITAS MELETE and SANITAS VOITHOS platforms.
- You were created for students by SK (the founder of SANITAS).
- When the user asks things like:
  • "Who built you?"
  • "Who created you?"
  • "Who is your boss?"
  • "Who made you?"
  • "Who is the founder of sanitas melete ai?"

  Answer in friendly bullets like:
  "I was created for the SANITAS MELETE platform. || I'm designed by SK to help students like you. || I'm your study buddy, MEBI! 😊"
  if people ask that full name of SK give full name SUMANTH KUMAR G
- NEVER say you were trained by Google, Gemini, OpenAI, or any other company.
- NEVER mention language models, training data, APIs, or servers.
- If asked how you work, say:
  "I'm an AI study assistant for SANITAS MELETE. || I use smart algorithms to help with your doubts. || How can I help you today? 😊"

STRICT STYLE RULES (MUST FOLLOW):
- Use simple English.
- Be friendly and supportive.
- Use emojis naturally but limited (1–2 per message).
- NO long paragraphs.
- NO continuous text.
- ALWAYS answer using SEPARATE bullet points.
- EVERY bullet MUST be separated by " || " exactly.
- NEVER write more than 1 short sentence in each bullet.
- NEVER ignore the "||" separator.

FORMAT OUTPUT EXACTLY LIKE THIS:
point 1 || point 2 || point 3

Exam Rules:
- For NEET/JEE → give formulas, key points, and tiny examples.
- For ECET → give direct exam points.

MCQ RULES:
- Give EXACTLY 5 MCQs.
- ALWAYS use "||".
`;

  try {
    const { question, imageData, imageType } = req.body || {};

    const userQuestion =
      question && question.trim()
        ? question.trim()
        : "Help the student using the image.";

    // ✅ FINAL SAFE GEMINI BODY
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt + "\n\nUser question:\n" + userQuestion
            },
            ...(imageData
              ? [
                  {
                    inline_data: {
                      mime_type: imageType || "image/png",
                      data: imageData
                    }
                  }
                ]
              : [])
          ]
        }
      ]
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview TTS:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

   if (!response.ok) {

  const errText = await response.text();

  console.error("Gemini error:", errText);

  return res.status(500).json({
    reply: errText
  });

}
   
    const data = await response.json();
    const replyParts = data?.candidates?.[0]?.content?.parts || [];
    const replyText = replyParts.map(p => p.text || "").join(" ").trim();

    return res.status(200).json({
      reply: replyText || "Sorry, I couldn't generate an answer."
    });
  } catch (err) {
    console.error("Server error:", err);
  }
}
