const { PermissionFlagsBits } = require("discord.js")
const { canModerateTarget } = require("./permissions")
const { sendModLog } = require("../guild/logs")

async function kickMember({ message, target, reason }) {
  const guild = message.guild
  const executor = message.member

  if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
    return { ok: false, reply: "I need Kick Members permission." }
  }

  const hierarchy = canModerateTarget(executor, target)
  if (!hierarchy.ok) return { ok: false, reply: hierarchy.reason }

  try {
    await target.kick(reason || "No reason provided.")

    await sendModLog(guild, {
      title: "User Kicked",
      moderator: executor.user.tag,
      target: target.user.tag,
      targetId: target.id,
      action: "Kick",
      reason: reason || "No reason provided.",
      channel: message.channel.toString()
    })

    return { ok: true, reply: `Kicked ${target.user.tag}.` }
  } catch {
    return { ok: false, reply: "Failed to kick that user." }
  }
}

module.exports = { kickMember }