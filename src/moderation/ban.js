const { PermissionFlagsBits } = require("discord.js")
const { canModerateTarget } = require("./permissions")
const { sendModLog } = require("../guild/logs")

async function banMember({ message, target, reason }) {
  const guild = message.guild
  const executor = message.member

  if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return { ok: false, reply: "I need Ban Members permission." }
  }

  const hierarchy = canModerateTarget(executor, target)
  if (!hierarchy.ok) return { ok: false, reply: hierarchy.reason }

  try {
    await target.ban({ reason: reason || "No reason provided." })

    await sendModLog(guild, {
      title: "User Banned",
      moderator: executor.user.tag,
      target: target.user.tag,
      targetId: target.id,
      action: "Ban",
      reason: reason || "No reason provided.",
      channel: message.channel.toString()
    })

    return { ok: true, reply: `Banned ${target.user.tag}.` }
  } catch {
    return { ok: false, reply: "Failed to ban that user." }
  }
}

module.exports = { banMember }