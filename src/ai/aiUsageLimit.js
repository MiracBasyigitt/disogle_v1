const { isPremiumGuild } = require("../storage/premiumStore")

const usageMap = new Map()

function getTodayKey() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const day = String(now.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getUserUsage(guildId, userId) {
  const key = `${guildId}:${userId}`
  const today = getTodayKey()

  if (!usageMap.has(key)) {
    usageMap.set(key, {
      day: today,
      chatCount: 0,
      utilityCount: 0
    })
  }

  const entry = usageMap.get(key)

  if (entry.day !== today) {
    entry.day = today
    entry.chatCount = 0
    entry.utilityCount = 0
  }

  return entry
}

function getLimits(guildId) {
  const premium = isPremiumGuild(guildId)

  if (premium) {
    return {
      chat: 300,
      utility: 100
    }
  }

  return {
    chat: 30,
    utility: 8
  }
}

function checkAIUsageLimit(guildId, userId, type = "chat") {
  const entry = getUserUsage(guildId, userId)
  const limits = getLimits(guildId)

  const limit = type === "utility" ? limits.utility : limits.chat
  const current = type === "utility" ? entry.utilityCount : entry.chatCount

  if (current >= limit) {
    return {
      ok: false,
      remaining: 0,
      used: current,
      limit,
      premium: isPremiumGuild(guildId)
    }
  }

  return {
    ok: true,
    remaining: limit - current,
    used: current,
    limit,
    premium: isPremiumGuild(guildId)
  }
}

function incrementAIUsage(guildId, userId, type = "chat") {
  const entry = getUserUsage(guildId, userId)

  if (type === "utility") {
    entry.utilityCount += 1
    return entry.utilityCount
  }

  entry.chatCount += 1
  return entry.chatCount
}

function getAIUsageStats(guildId, userId) {
  const entry = getUserUsage(guildId, userId)
  const limits = getLimits(guildId)

  return {
    day: entry.day,
    chatCount: entry.chatCount,
    utilityCount: entry.utilityCount,
    chatLimit: limits.chat,
    utilityLimit: limits.utility,
    premium: isPremiumGuild(guildId)
  }
}

module.exports = {
  checkAIUsageLimit,
  incrementAIUsage,
  getAIUsageStats
}