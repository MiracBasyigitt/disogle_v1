const { ChannelType, EmbedBuilder, PermissionsBitField } = require("discord.js")
const { logWarn } = require("../core/logger")

const LOG_CHANNEL_NAME = "disogle-logs"

async function getOrCreateLogChannel(guild) {
  if (!guild || !guild.channels) return null

  let channel = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText && ch.name === LOG_CHANNEL_NAME
  )

  if (channel) return channel

  try {
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return null
    }

    channel = await guild.channels.create({
      name: LOG_CHANNEL_NAME,
      type: ChannelType.GuildText,
      topic: "Automatic moderation logs by Disogle",
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.SendMessages]
        }
      ]
    })

    return channel
  } catch (error) {
    logWarn("getOrCreateLogChannel failed:", error.message)
    return null
  }
}

async function sendModLog(guild, payload = {}) {
  try {
    const channel = await getOrCreateLogChannel(guild)
    if (!channel) return false

    const embed = new EmbedBuilder()
      .setTitle(payload.title || "Moderation Action")
      .setDescription(payload.description || "No details provided.")
      .addFields(
        { name: "Moderator", value: payload.moderator || "Unknown", inline: true },
        { name: "Target", value: payload.target || "Unknown", inline: true },
        { name: "Action", value: payload.action || "Unknown", inline: true }
      )
      .setTimestamp()

    if (payload.reason) {
      embed.addFields({ name: "Reason", value: String(payload.reason).slice(0, 1024), inline: false })
    }

    if (payload.duration) {
      embed.addFields({ name: "Duration", value: String(payload.duration), inline: true })
    }

    if (payload.channel) {
      embed.addFields({ name: "Channel", value: String(payload.channel), inline: true })
    }

    if (payload.targetId) {
      embed.addFields({ name: "User ID", value: String(payload.targetId), inline: true })
    }

    await channel.send({ embeds: [embed] })
    return true
  } catch (error) {
    logWarn("sendModLog failed:", error.message)
    return false
  }
}

module.exports = {
  LOG_CHANNEL_NAME,
  getOrCreateLogChannel,
  sendModLog
}