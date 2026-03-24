const { ChannelType, PermissionsBitField } = require("discord.js")
const { enableAIChat } = require("./aiChatState")

async function createAIChannel(guild) {
  if (!guild || !guild.channels) return null

  const existing = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText && ch.name === "disogle-ai"
  )

  if (existing) {
    enableAIChat(guild.id, existing.id)
    return existing
  }

  if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    return null
  }

  const channel = await guild.channels.create({
    name: "disogle-ai",
    type: ChannelType.GuildText,
    topic: "Talk with Disogle AI here."
  })

  enableAIChat(guild.id, channel.id)

  return channel
}

module.exports = {
  createAIChannel
}