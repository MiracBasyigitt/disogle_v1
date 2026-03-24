const OpenAI = require("openai")

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function writeAnnouncement(topic) {
  try {
    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are Disogle AI.

Write professional Discord announcements.

Rules:
- clear title
- short paragraphs
- use emojis
- friendly but authoritative tone
- make it copy-paste ready
- no markdown code blocks`
        },
        {
          role: "user",
          content: `Write a Discord server announcement about: ${topic}`
        }
      ]
    })

    return completion.choices?.[0]?.message?.content || "I could not write the announcement."
  } catch (error) {
    console.log("Announcement error:", error.message)
    return "I could not write the announcement right now."
  }
}

module.exports = {
  writeAnnouncement
}