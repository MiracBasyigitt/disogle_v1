const userCooldowns = new Map()

function getKey(guildId, userId) {
  return `${guildId}:${userId}`
}

function checkAIRateLimit(guildId, userId, cooldownMs = 8000) {
  const key = getKey(guildId, userId)
  const now = Date.now()
  const last = userCooldowns.get(key) || 0

  const remaining = cooldownMs - (now - last)

  if (remaining > 0) {
    return {
      ok: false,
      remainingMs: remaining
    }
  }

  userCooldowns.set(key, now)

  return {
    ok: true,
    remainingMs: 0
  }
}

module.exports = {
  checkAIRateLimit
}