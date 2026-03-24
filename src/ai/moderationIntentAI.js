const OpenAI = require("openai")

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function detectModerationIntentAI({ message }) {
  try {
    const content = message.content || ""

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a Discord moderation intent classifier.

Return only valid JSON.

Allowed intents:
mute
unmute
ban
kick
warn
warnings
clear_warnings
lock
unlock
slowmode
none

Rules:
- If the message is not asking for a moderation/server action, return intent as "none".
- Extract short duration like "10m", "1h", "30s" if present.
- Extract short reason if clearly present.
- Do not explain anything.
- Output JSON only in this format:
{
  "intent": "none",
  "duration": null,
  "reason": null
}`
        },
        {
          role: "user",
          content: content
        }
      ]
    })

    const text = completion.choices?.[0]?.message?.content
    if (!text) return null

    const parsed = JSON.parse(text)

    if (!parsed.intent || parsed.intent === "none") {
      return null
    }

    return {
      intent: parsed.intent,
      duration: parsed.duration || null,
      reason: parsed.reason || null
    }
  } catch (error) {
    console.log("AI moderation intent error:", error.message)
    return null
  }
}

module.exports = {
  detectModerationIntentAI
}