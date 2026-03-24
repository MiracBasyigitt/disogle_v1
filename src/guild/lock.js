const { PermissionsBitField } = require("discord.js")
const { sendModLog } = require("./logs")

async function lockChannel(message) {
  const channel = message.channel
  const guild = message.guild
  const executor = message.member

  try {
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false
    })

    await sendModLog(guild, {
      title: "Channel Locked",
      moderator: executor.user.tag,
      target: "Everyone",
      action: "Lock",
      channel: channel.toString()
    })

    return { ok: true, reply: `Locked ${channel.name}.` }
  } catch {
    return { ok: false, reply: "Failed to lock channel." }
  }
}

async function unlockChannel(message) {
  const channel = message.channel
  const guild = message.guild
  const executor = message.member

  try {
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: true
    })

    await sendModLog(guild, {
      title: "Channel Unlocked",
      moderator: executor.user.tag,
      target: "Everyone",
      action: "Unlock",
      channel: channel.toString()
    })

    return { ok: true, reply: `Unlocked ${channel.name}.` }
  } catch {
    return { ok: false, reply: "Failed to unlock channel." }
  }
}

module.exports = { lockChannel, unlockChannel }