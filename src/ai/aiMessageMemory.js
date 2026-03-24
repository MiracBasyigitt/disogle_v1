const channelMemories = new Map()

function getChannelMemory(channelId) {
  if (!channelMemories.has(channelId)) {
    channelMemories.set(channelId, [])
  }

  return channelMemories.get(channelId)
}

function addMessageToMemory(channelId, entry) {
  const memory = getChannelMemory(channelId)

  memory.push({
    role: entry.role,
    content: String(entry.content || "").slice(0, 2000),
    timestamp: Date.now()
  })

  while (memory.length > 12) {
    memory.shift()
  }

  return memory
}

function getRecentMemory(channelId) {
  const memory = getChannelMemory(channelId)
  const now = Date.now()

  const fresh = memory.filter(item => now - item.timestamp <= 30 * 60 * 1000)

  channelMemories.set(channelId, fresh)

  return fresh.map(item => ({
    role: item.role,
    content: item.content
  }))
}

function clearChannelMemory(channelId) {
  channelMemories.delete(channelId)
}

module.exports = {
  addMessageToMemory,
  getRecentMemory,
  clearChannelMemory
}