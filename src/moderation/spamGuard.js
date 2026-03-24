const { hasModerationAccess, botHasPermission } = require("./permissions")
const {
  trackMessage,
  normalizeSpamText,
  countRecentMessages,
  countRecentLinks,
  countRepeatedMessages,
  setPunishmentFlag,
  hasPunishmentFlag
} = require("../storage/spamMemory")
const { addWarning } = require("../storage/memory")
const { sendModLog } = require("../guild/logs")
const { PermissionFlagsBits } = require("discord.js")

function isUppercaseSpam(content = "") {
  const letters = String(content).replace(/[^a-zA-Z]/g, "")
  if (letters.length < 12) return false

  const upper = letters.replace(/[^A-Z]/g, "").length
  return upper / letters.length >= 0.7
}

function canBotActOnMember(guild, member) {
  const me = guild?.members?.me
  if (!guild || !me || !member) return false
  if (member.id === guild.ownerId) return false
  if (member.user?.bot) return false
  return me.roles.highest.position > member.roles.highest.position
}

async function applyAutoWarn(message, member, reason) {
  if (!message.guild || !member) return null
  if (!canBotActOnMember(message.guild, member)) return null

  const warnings = addWarning(message.guild.id, member.id, {
    reason,
    moderatorId: message.guild.members.me?.id || "disogle-automod",
    timestamp: Date.now()
  })

  await sendModLog(message.guild, {
    title: "Spam Guard Triggered",
    moderator: "Disogle AutoMod",
    target: member.user.tag,
    targetId: member.id,
    action: "Auto Warn",
    reason,
    channel: message.channel.toString()
  })

  return {
    ok: true,
    reply: `${member.user.tag} has been warned automatically. Total warnings: ${warnings.length}.`
  }
}

async function applyAutoMute(message, member, reason, durationMs) {
  if (!message.guild || !member) return null
  if (!canBotActOnMember(message.guild, member)) return null

  if (!botHasPermission(message.guild, PermissionFlagsBits.ModerateMembers)) {
    return null
  }

  const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000
  const safeDuration = Math.min(durationMs, maxTimeoutMs)

  await member.timeout(safeDuration, reason)

  await sendModLog(message.guild, {
    title: "Spam Guard Triggered",
    moderator: "Disogle AutoMod",
    target: member.user.tag,
    targetId: member.id,
    action: "Auto Mute",
    reason,
    duration: "10m",
    channel: message.channel.toString()
  })

  return {
    ok: true,
    reply: `${member.user.tag} has been muted automatically for 10m.`
  }
}

async function runSpamGuard(message) {
  if (!message.guild || !message.member || !message.content) return null
  if (message.author?.bot) return null

  if (hasModerationAccess(message.member)) {
    return null
  }

  const guildId = message.guild.id
  const userId = message.author.id
  const content = message.content
  const normalized = normalizeSpamText(content)

  const userState = trackMessage({
    guildId,
    userId,
    content
  })

  const flood6s = countRecentMessages(userState, 6000)
  const flood8s = countRecentMessages(userState, 8000)
  const repeat10s = countRepeatedMessages(userState, normalized, 10000)
  const links20s = countRecentLinks(userState, 20000)
  const links30s = countRecentLinks(userState, 30000)
  const capsSpam = isUppercaseSpam(content)

  if (flood8s >= 8 && !hasPunishmentFlag(userState, "mutedFlood")) {
    setPunishmentFlag(userState, "mutedFlood")

    return await applyAutoMute(
      message,
      message.member,
      "Flood spam detected by Disogle.",
      10 * 60 * 1000
    )
  }

  if (flood6s >= 5 && !hasPunishmentFlag(userState, "warnedFlood")) {
    setPunishmentFlag(userState, "warnedFlood")

    return await applyAutoWarn(
      message,
      message.member,
      "Flood spam suspected by Disogle."
    )
  }

  if (repeat10s >= 5 && !hasPunishmentFlag(userState, "mutedRepeat")) {
    setPunishmentFlag(userState, "mutedRepeat")

    return await applyAutoMute(
      message,
      message.member,
      "Repeated message spam detected by Disogle.",
      10 * 60 * 1000
    )
  }

  if (repeat10s >= 3 && !hasPunishmentFlag(userState, "warnedRepeat")) {
    setPunishmentFlag(userState, "warnedRepeat")

    return await applyAutoWarn(
      message,
      message.member,
      "Repeated message spam suspected by Disogle."
    )
  }

  if (links30s >= 5 && !hasPunishmentFlag(userState, "mutedLinks")) {
    setPunishmentFlag(userState, "mutedLinks")

    return await applyAutoMute(
      message,
      message.member,
      "Link spam detected by Disogle.",
      10 * 60 * 1000
    )
  }

  if (links20s >= 3 && !hasPunishmentFlag(userState, "warnedLinks")) {
    setPunishmentFlag(userState, "warnedLinks")

    return await applyAutoWarn(
      message,
      message.member,
      "Link spam suspected by Disogle."
    )
  }

  if (capsSpam && !hasPunishmentFlag(userState, "warnedCaps")) {
    setPunishmentFlag(userState, "warnedCaps")

    return await applyAutoWarn(
      message,
      message.member,
      "Excessive caps detected by Disogle."
    )
  }

  return null
}

module.exports = {
  runSpamGuard
}