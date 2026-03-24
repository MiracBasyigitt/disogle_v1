const { PermissionFlagsBits } = require("discord.js")
const { canModerateTarget } = require("./permissions")
const { sendModLog } = require("../guild/logs")

async function unmuteMember({ message, target, reason }) {
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

  try {
    await target.timeout(null, reason || "Timeout removed by moderator.")

    await sendModLog(guild, {
      title: "User Unmuted",
      moderator: `${executor.user.tag}`,
      target: `${target.user.tag}`,
      targetId: target.id,
      action: "Unmute",
      reason: reason || "No reason provided.",
      channel: message.channel?.toString() || "Unknown"
    })

    return {
      ok: true,
      reply: `Unmuted ${target.user.tag}.`
    }
  } catch {
    return {
      ok: false,
      reply: "Failed to unmute that user."
    }
  }
}

module.exports = {
  unmuteMember
}