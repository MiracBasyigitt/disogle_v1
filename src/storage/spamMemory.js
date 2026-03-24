const spamState = new Map()

function getGuildState(guildId) {
  if (!spamState.has(guildId)) {
    spamState.set(guildId, new Map())
  }

  return spamState.get(guildId)
}

function getUserState(guildId, userId) {
  const guildState = getGuildState(guildId)

  if (!guildState.has(userId)) {
    guildState.set(userId, {
      messages: [],
      lastMessages: [],
      linkTimestamps: [],
      punishments: {
        warnedFlood: false,
        mutedFlood: false,
        warnedRepeat: false,
        mutedRepeat: false,
        warnedCaps: false,
        warnedLinks: false,
        mutedLinks: false
      }
    })
  }

  return guildState.get(userId)
}

function cleanupOldEntries(userState, now = Date.now()) {
  userState.messages = userState.messages.filter(item => now - item.timestamp <= 30000)
  userState.linkTimestamps = userState.linkTimestamps.filter(timestamp => now - timestamp <= 30000)
  userState.lastMessages = userState.lastMessages.filter(item => now - item.timestamp <= 30000)
}

function trackMessage({ guildId, userId, content }) {
  const now = Date.now()
  const userState = getUserState(guildId, userId)

  cleanupOldEntries(userState, now)

  userState.messages.push({
    content,
    timestamp: now
  })

  userState.lastMessages.push({
    content: normalizeSpamText(content),
    timestamp: now
  })

  if (containsLink(content)) {
    userState.linkTimestamps.push(now)
  }

  return userState
}

function normalizeSpamText(content = "") {
  return String(content)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function containsLink(content = "") {
  return /(https?:\/\/|discord\.gg\/|www\.)/i.test(content)
}

function countRecentMessages(userState, ms) {
  const now = Date.now()
  return userState.messages.filter(item => now - item.timestamp <= ms).length
}

function countRecentLinks(userState, ms) {
  const now = Date.now()
  return userState.linkTimestamps.filter(timestamp => now - timestamp <= ms).length
}

function countRepeatedMessages(userState, normalizedContent, ms) {
  const now = Date.now()

  return userState.lastMessages.filter(
    item => item.content && item.content === normalizedContent && now - item.timestamp <= ms
  ).length
}

function resetPunishmentFlag(userState, flag) {
  if (!userState?.punishments) return
  userState.punishments[flag] = false
}

function setPunishmentFlag(userState, flag) {
  if (!userState?.punishments) return
  userState.punishments[flag] = true
}

function hasPunishmentFlag(userState, flag) {
  if (!userState?.punishments) return false
  return Boolean(userState.punishments[flag])
}

module.exports = {
  trackMessage,
  normalizeSpamText,
  containsLink,
  countRecentMessages,
  countRecentLinks,
  countRepeatedMessages,
  setPunishmentFlag,
  hasPunishmentFlag,
  resetPunishmentFlag
}