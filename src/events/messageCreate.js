const { PermissionsBitField } = require("discord.js")
const { createAIChannel } = require("../ai/createAIChannel")
const PremiumManager = require("../core/premiumManager")

const usage = new Map()
const spamMap = new Map()

module.exports = async (client, message) => {
  try {
    if (!message.guild) return
    if (message.author.bot) return

    const content = message.content.toLowerCase().trim()

    if (!content.startsWith("disogle")) return

    const args = content.split(" ").slice(1)
    const command = args.join(" ")

    const guildId = message.guild.id
    const userId = message.author.id

    const isPremiumGuild = PremiumManager.isPremiumGuild(guildId)
    const isPremiumUser = PremiumManager.isPremiumUser(userId)

    const premium = isPremiumGuild || isPremiumUser

    const limits = premium
      ? { chat: 300, utility: 100 }
      : { chat: 40, utility: 8 }

    if (!usage.has(guildId)) {
      usage.set(guildId, { chat: 0, utility: 0 })
    }

    const guildUsage = usage.get(guildId)

    const reply = async (text) => {
      try {
        await message.reply({ content: text })
      } catch {}
    }

    /* =========================
       FOUNDER IDENTITY FIX
    ========================= */

    if (
      command.includes("who created you") ||
      command.includes("seni kim yarattı") ||
      command.includes("kurucun kim")
    ) {
      return reply(
        "I am Disogle AI. I was created and developed by Miraç Başyiğit, founder of Disogle."
      )
    }

    /* =========================
       PREMIUM STATUS
    ========================= */

    if (command === "premium status") {
      if (premium) {
        return reply("This server is on the premium plan: PRO.")
      } else {
        return reply("This server is on the free plan.")
      }
    }

    /* =========================
       AI USAGE
    ========================= */

    if (command === "ai usage") {
      return reply(
        `Your AI usage today:\n\nPlan: ${
          premium ? "Premium" : "Free"
        }\nChat: ${guildUsage.chat}/${limits.chat}\nUtility: ${
          guildUsage.utility
        }/${limits.utility}`
      )
    }

    /* =========================
       LOCK CHANNEL
    ========================= */

    if (command === "lock") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return reply("You need Manage Channels permission.")

      await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        { SendMessages: false }
      )

      guildUsage.utility++
      return reply(`Locked ${message.channel.name}.`)
    }

    /* =========================
       UNLOCK CHANNEL
    ========================= */

    if (command === "unlock") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return reply("You need Manage Channels permission.")

      await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        { SendMessages: true }
      )

      guildUsage.utility++
      return reply(`Unlocked ${message.channel.name}.`)
    }

    /* =========================
       SLOWMODE
    ========================= */

    if (command.startsWith("slowmode")) {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return reply("You need Manage Channels permission.")

      const seconds = parseInt(args[1])
      if (isNaN(seconds)) return reply("Example: disogle slowmode 10")

      await message.channel.setRateLimitPerUser(seconds)

      guildUsage.utility++
      return reply(`Slowmode set to ${seconds}s.`)
    }

    /* =========================
       ENABLE AI CHAT
    ========================= */

    if (command === "enable ai chat") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return reply("You need Manage Channels permission.")

      const channel = await createAIChannel(message.guild)

      if (!channel) return reply("AI channel creation failed.")

      guildUsage.utility++

      return reply(`AI chat enabled in <#${channel.id}>.`)
    }

    /* =========================
       SPAM AUTO MUTE SYSTEM
    ========================= */

    if (!spamMap.has(userId)) {
      spamMap.set(userId, { count: 0, time: Date.now() })
    }

    const data = spamMap.get(userId)

    if (Date.now() - data.time < 4000) {
      data.count++
    } else {
      data.count = 0
      data.time = Date.now()
    }

    if (data.count >= 6) {
      try {
        await message.member.timeout(60000)
        reply("Auto mute: spam detected.")
      } catch {}
      return
    }

    /* =========================
       AI CHAT RESPONSE
    ========================= */

    if (guildUsage.chat >= limits.chat) {
      return reply(
        "AI limit reached. Upgrade to premium for higher limits."
      )
    }

    guildUsage.chat++

    const aiChannel =
      message.guild.channels.cache.find(
        (c) => c.name === "disogle-ai"
      ) || message.channel

    const response = await client.ai.ask(command)

    return aiChannel.send(response)
  } catch (err) {
    console.error("messageCreate crash:", err)
  }
}