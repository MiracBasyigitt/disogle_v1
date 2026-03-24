const warnings = new Map()

function getGuildWarnings(guildId) {
  if (!warnings.has(guildId)) {
    warnings.set(guildId, new Map())
  }

  return warnings.get(guildId)
}

function addWarning(guildId, userId, warning) {
  const guildWarnings = getGuildWarnings(guildId)

  if (!guildWarnings.has(userId)) {
    guildWarnings.set(userId, [])
  }

  const userWarnings = guildWarnings.get(userId)
  userWarnings.push(warning)

  return userWarnings
}

function getWarnings(guildId, userId) {
  const guildWarnings = getGuildWarnings(guildId)
  return guildWarnings.get(userId) || []
}

function clearWarnings(guildId, userId) {
  const guildWarnings = getGuildWarnings(guildId)
  guildWarnings.delete(userId)
}

module.exports = {
  addWarning,
  getWarnings,
  clearWarnings
}