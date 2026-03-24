const { PermissionFlagsBits } = require("discord.js")
const { canModerateTarget } = require("./permissions")
const { formatDuration } = require("../utils/duration")
const { sendModLog } = require("../guild/logs")

async function muteMember({ message, target, durationMs, reason }) {
  const guild = message.guild
  const executor = message.member

  if (!guild || !executor || !target) {
    return { ok: false, reply: "Invalid moderation context." }
  }

  if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return { ok: false, reply: "I need Moderate Members permission." }
  }

  const hierarchy = canModerateTarget(executor, target)
  if (!hierarchy.ok) {
    return { ok: false, reply: hierarchy.reason }
  }

  if (!durationMs) {
    return { ok: false, reply: "Please provide a valid mute duration." }
  }

  const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000
  const safeDuration = Math.min(durationMs, maxTimeoutMs)

  try {
    await target.timeout(safeDuration, reason || "No reason provided.")

    await sendModLog(guild, {
      title: "User Muted",
      moderator: `${executor.user.tag}`,
      target: `${target.user.tag}`,
      targetId: target.id,
      action: "Mute",
      duration: formatDuration(safeDuration),
      reason: reason || "No reason provided.",
      channel: message.channel?.toString() || "Unknown"
    })

    return {
      ok: true,
      reply: `Muted ${target.user.tag} for ${formatDuration(safeDuration)}.`
    }
  } catch {
    return {
      ok: false,
      reply: "Failed to mute that user."
    }
  }
}

module.exports = {
  muteMember
}