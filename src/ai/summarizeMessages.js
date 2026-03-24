const OpenAI = require("openai")

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function summarizeRecentMessages(channel, limit = 20) {
  try {
    const fetched = await channel.messages.fetch({ limit })
    const messages = [...fetched.values()]
      .filter(msg => !msg.author.bot && msg.content)
      .reverse()

    if (!messages.length) {
      return "There are no recent user messages to summarize."
    }

    const transcript = messages
      .map(msg => `${msg.author.username}: ${msg.content}`)
      .join("\n")
      .slice(0, 12000)

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are Disogle, an AI Discord assistant.

Summarize recent Discord chat clearly and briefly.

Rules:
- keep it concise
- use simple language
- mention main topics
- mention decisions if any
- mention conflicts or questions if relevant
- do not invent details`
        },
        {
          role: "user",
          content: `Summarize these recent Discord messages:\n\n${transcript}`
        }
      ]
    })

    return completion.choices?.[0]?.message?.content?.trim() || "I could not summarize the recent messages."
  } catch (error) {
    console.log("Summarize error:", error.message)
    return "I could not summarize the recent messages right now."
  }
}

module.exports = {
  summarizeRecentMessages
}