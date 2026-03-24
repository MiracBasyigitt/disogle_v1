const { parseModerationCommand } = require("../core/commandParser")
const { hasModerationAccess } = require("../moderation/permissions")
const { muteMember } = require("../moderation/mute")
const { unmuteMember } = require("../moderation/unmute")
const { warnMember, listWarnings, resetWarnings } = require("../moderation/warn")
const { banMember } = require("../moderation/ban")
const { kickMember } = require("../moderation/kick")
const { detectModerationIntentAI } = require("../ai/moderationIntentAI")
const { parseDuration } = require("../utils/duration")
const { lockChannel, unlockChannel } = require("../guild/lock")
const { setSlowmode } = require("../guild/slowmode")
const { safeReply } = require("../utils/safeReply")
const { logError } = require("../core/logger")
const { runSpamGuard } = require("../moderation/spamGuard")
const { createAIChannel } = require("../ai/createAIChannel")
const { disableAIChat, isAIChatChannel } = require("../ai/aiChatState")
const { generateAIReply } = require("../ai/aiReply")
const { checkAIRateLimit } = require("../ai/aiRateLimit")
const { summarizeRecentMessages } = require("../ai/summarizeMessages")
const { writeAnnouncement } = require("../ai/writeAnnouncement")
const { checkAIUsageLimit, incrementAIUsage, getAIUsageStats } = require("../ai/aiUsageLimit")
const { activatePremium, deactivatePremium, getPremiumInfo } = require("../storage/premiumStore")

module.exports = {
  name: "messageCreate",
  async execute(message) {
    try {
      if (!message || !message.guild) return
      if (message.author?.bot) return
      if (!message.content) return
      if (!message.member) return

      const lowered = message.content.toLowerCase().trim()

      if (lowered === "disogle premium status") {
        const info = getPremiumInfo(message.guild.id)

        if (!info || !info.active) {
          await safeReply(message, "This server is on the free plan.")
          return
        }

        await safeReply(message, `This server is on the premium plan: ${info.plan}.`)
        return
      }

      if (lowered.startsWith("disogle premium activate")) {
        if (String(message.author.id) !== String(process.env.OWNER_ID)) {
          await safeReply(message, "You are not allowed to use this command.")
          return
        }

        const parts = message.content.trim().split(/\s+/)
        const guildId = parts[3] || message.guild.id

        activatePremium(guildId, "pro")

        await safeReply(message, `Premium activated for guild ${guildId}.`)
        return
      }

      if (lowered.startsWith("disogle premium deactivate")) {
        if (String(message.author.id) !== String(process.env.OWNER_ID)) {
          await safeReply(message, "You are not allowed to use this command.")
          return
        }

        const parts = message.content.trim().split(/\s+/)
        const guildId = parts[3] || message.guild.id

        deactivatePremium(guildId)

        await safeReply(message, `Premium deactivated for guild ${guildId}.`)
        return
      }

      if (lowered === "disogle ai usage" || lowered === "disogle usage") {
        const stats = getAIUsageStats(message.guild.id, message.author.id)

        await safeReply(
          message,
          `Your AI usage today:
- Plan: ${stats.premium ? "Premium" : "Free"}
- Chat: ${stats.chatCount}/${stats.chatLimit}
- Utility: ${stats.utilityCount}/${stats.utilityLimit}`
        )
        return
      }

      if (lowered.startsWith("disogle write an announcement")) {
        const usage = checkAIUsageLimit(message.guild.id, message.author.id, "utility")

        if (!usage.ok) {
          await safeReply(message, "You reached your daily AI utility limit.")
          return
        }

        const topic = message.content
          .replace(/disogle write an announcement about/i, "")
          .replace(/disogle write an announcement/i, "")
          .trim()

        if (!topic) {
          await safeReply(message, "Please tell me the topic of the announcement.")
          return
        }

        const text = await writeAnnouncement(topic)

        incrementAIUsage(message.guild.id, message.author.id, "utility")

        await safeReply(message, text)
        return
      }

      if (
        lowered.includes("summarize this chat") ||
        lowered.includes("summarize last messages") ||
        lowered.startsWith("disogle summarize")
      ) {
        const usage = checkAIUsageLimit(message.guild.id, message.author.id, "utility")

        if (!usage.ok) {
          await safeReply(message, "You reached your daily AI utility limit.")
          return
        }

        const summary = await summarizeRecentMessages(message.channel, 20)

        incrementAIUsage(message.guild.id, message.author.id, "utility")

        await safeReply(message, summary)
        return
      }

      if (lowered.includes("enable ai chat")) {
        if (!hasModerationAccess(message.member)) {
          await safeReply(message, "You do not have permission to enable AI chat.")
          return
        }

        const channel = await createAIChannel(message.guild)

        if (!channel) {
          await safeReply(message, "I need Manage Channels permission to create the AI chat channel.")
          return
        }

        await safeReply(message, `AI chat enabled in ${channel}.`)
        return
      }

      if (lowered.includes("disable ai chat")) {
        if (!hasModerationAccess(message.member)) {
          await safeReply(message, "You do not have permission to disable AI chat.")
          return
        }

        disableAIChat(message.guild.id)
        await safeReply(message, "AI chat disabled.")
        return
      }

      const spamResult = await runSpamGuard(message)

      if (spamResult?.reply) {
        await safeReply(message, spamResult.reply)
        return
      }

      if (isAIChatChannel(message.guild.id, message.channel.id)) {
        const rate = checkAIRateLimit(message.guild.id, message.author.id, 8000)

        if (!rate.ok) {
          return
        }

        const usage = checkAIUsageLimit(message.guild.id, message.author.id, "chat")

        if (!usage.ok) {
          await safeReply(message, "You reached your daily AI chat limit.")
          return
        }

        await message.channel.sendTyping().catch(() => null)

        const aiReply = await generateAIReply({ message })

        if (!aiReply) {
          await safeReply(message, "I could not generate a response right now.")
          return
        }

        incrementAIUsage(message.guild.id, message.author.id, "chat")

        await safeReply(message, aiReply)
        return
      }

      let finalCommand = parseModerationCommand(message)

      if (!finalCommand) {
        const botMentioned =
          message.mentions.has(message.client.user) ||
          lowered.includes("disogle")

        if (botMentioned) {
          const aiIntent = await detectModerationIntentAI({ message })

          if (aiIntent && aiIntent.intent && aiIntent.intent !== "none") {
            finalCommand = {
              intent: aiIntent.intent,
              target: message.mentions.members.first() || null,
              durationMs: aiIntent.duration ? parseDuration(aiIntent.duration) : null,
              reason: aiIntent.reason || null,
              raw: message.content
            }
          }
        }
      }

      if (!finalCommand) return

      if (!hasModerationAccess(message.member)) {
        await safeReply(message, "You do not have permission to use moderation actions.")
        return
      }

      if (
        ["mute", "unmute", "warn", "warnings", "clear_warnings", "ban", "kick"].includes(finalCommand.intent) &&
        !finalCommand.target
      ) {
        await safeReply(message, "Please mention a target user.")
        return
      }

      let result = null

      if (finalCommand.intent === "mute") {
        result = await muteMember({
          message,
          target: finalCommand.target,
          durationMs: finalCommand.durationMs || 10 * 60 * 1000,
          reason: finalCommand.reason
        })
      }

      if (finalCommand.intent === "unmute") {
        result = await unmuteMember({
          message,
          target: finalCommand.target,
          reason: finalCommand.reason
        })
      }

      if (finalCommand.intent === "warn") {
        result = await warnMember({
          message,
          target: finalCommand.target,
          reason: finalCommand.reason
        })
      }

      if (finalCommand.intent === "warnings") {
        result = await listWarnings({
          message,
          target: finalCommand.target
        })
      }

      if (finalCommand.intent === "clear_warnings") {
        result = await resetWarnings({
          message,
          target: finalCommand.target
        })
      }

      if (finalCommand.intent === "ban") {
        result = await banMember({
          message,
          target: finalCommand.target,
          reason: finalCommand.reason
        })
      }

      if (finalCommand.intent === "kick") {
        result = await kickMember({
          message,
          target: finalCommand.target,
          reason: finalCommand.reason
        })
      }

      if (finalCommand.intent === "lock") {
        result = await lockChannel(message)
      }

      if (finalCommand.intent === "unlock") {
        result = await unlockChannel(message)
      }

      if (finalCommand.intent === "slowmode") {
        const seconds = finalCommand.durationMs
          ? Math.floor(finalCommand.durationMs / 1000)
          : 10

        result = await setSlowmode(message, seconds)
      }

      if (!result || !result.reply) return

      await safeReply(message, result.reply)
    } catch (error) {
      logError("messageCreate execute failed:", error.message)
    }
  }
}