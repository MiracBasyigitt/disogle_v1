const aiChatChannels = new Map()

function enableAIChat(guildId, channelId) {
  aiChatChannels.set(guildId, channelId)
}

function disableAIChat(guildId) {
  aiChatChannels.delete(guildId)
}

function getAIChatChannel(guildId) {
  return aiChatChannels.get(guildId) || null
}

function isAIChatChannel(guildId, channelId) {
  const saved = aiChatChannels.get(guildId)
  if (!saved) return false
  return saved === channelId
}

module.exports = {
  enableAIChat,
  disableAIChat,
  getAIChatChannel,
  isAIChatChannel
}