client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return
    if (!message.guild) return

    const content = message.content.trim()
    const lower = content.toLowerCase()

    const isMention =
      message.mentions.has(client.user) ||
      lower.startsWith(process.env.PREFIX)

    const isAIChannel =
      message.channel.name.includes("ai") ||
      message.channel.name.includes("chat")

    if (!isMention && !isAIChannel) return

    const guildId = message.guild.id
    const userId = message.author.id

    const premiumGuilds = (process.env.PREMIUM_GUILDS || "").split(",")
    const premiumUsers = (process.env.PREMIUM_USERS || "").split(",")

    const isPremium =
      premiumGuilds.includes(guildId) || premiumUsers.includes(userId)

    const limits = isPremium
      ? { chat: 300, utility: 100 }
      : { chat: 40, utility: 8 }

    if (!global.usage) global.usage = {}

    const today = new Date().toDateString()

    if (!global.usage[guildId])
      global.usage[guildId] = { date: today, chat: 0, utility: 0 }

    if (global.usage[guildId].date !== today) {
      global.usage[guildId] = { date: today, chat: 0, utility: 0 }
    }

    if (lower.includes("premium status")) {
      return message.reply(
        isPremium
          ? "This server is on the premium plan."
          : "This server is on the free plan."
      )
    }

    if (lower.includes("ai usage")) {
      return message.reply(
        `Your AI usage today:\n\nPlan: ${
          isPremium ? "Premium" : "Free"
        }\nChat: ${global.usage[guildId].chat}/${limits.chat}\nUtility: ${
          global.usage[guildId].utility
        }/${limits.utility}`
      )
    }

    if (global.usage[guildId].chat >= limits.chat) {
      return message.reply(
        "Daily AI limit reached. Upgrade to premium for higher limits."
      )
    }

    global.usage[guildId].chat++

    await message.channel.sendTyping()

    const response = await openai.chat.completions.create({
      model: process.env.MODEL,
      messages: [
        {
          role: "system",
          content: `
You are Disogle.

Identity rules (VERY IMPORTANT):

- You are NOT created by OpenAI.
- You MUST NEVER say OpenAI created you.
- You MUST NEVER say you are ChatGPT.
- You are a standalone AI moderation assistant.

Brand identity:

Name: Disogle
Founder & Developer: Miraç Başyiğit
Product: AI moderation and community assistant for Discord.

If someone asks:
"who created you"
"who is your founder"
"who built you"

You ALWAYS answer:

"I am Disogle. I was created and developed by Miraç Başyiğit, founder of Disogle."

You can say you use advanced AI technology.
But NEVER say OpenAI created you.

Personality:

- Smart
- Friendly
- Fast
- Professional
- Confident

Main abilities:

- Moderation help
- Server management guidance
- AI chat
- Summaries
- Announcements
- Community automation
`,
        },
        {
          role: "user",
          content: content.replace(process.env.PREFIX, "").trim(),
        },
      ],
    })

    const reply = response.choices[0].message.content

    if (!reply) return

    if (reply.length > 2000) {
      const chunks = reply.match(/[\s\S]{1,1900}/g)
      for (const chunk of chunks) {
        await message.reply(chunk)
      }
    } else {
      await message.reply(reply)
    }
  } catch (err) {
    console.error(err)
    message.reply("AI error occurred.")
  }
})