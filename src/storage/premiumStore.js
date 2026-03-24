const fs = require("fs")
const path = require("path")

const FILE_PATH = path.join(__dirname, "premium.json")

function ensureFile() {
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({ guilds: [] }, null, 2))
  }
}

function readPremiumFile() {
  try {
    ensureFile()
    const raw = fs.readFileSync(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw)

    if (!parsed.guilds || !Array.isArray(parsed.guilds)) {
      return { guilds: [] }
    }

    return parsed
  } catch {
    return { guilds: [] }
  }
}

function writePremiumFile(data) {
  ensureFile()
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2))
}

function getEnvPremiumUsers() {
  return String(process.env.PREMIUM_USERS || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
}

function getEnvPremiumGuilds() {
  return String(process.env.PREMIUM_GUILDS || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
}

function isPremiumUser(userId) {
  return getEnvPremiumUsers().includes(String(userId))
}

function isPremiumGuild(guildId) {
  const envGuilds = getEnvPremiumGuilds()
  if (envGuilds.includes(String(guildId))) return true

  const data = readPremiumFile()
  return data.guilds.some(entry => entry.guildId === String(guildId) && entry.active)
}

function activatePremium(guildId, plan = "pro") {
  const data = readPremiumFile()
  const normalizedGuildId = String(guildId)
  const existing = data.guilds.find(entry => entry.guildId === normalizedGuildId)

  if (existing) {
    existing.active = true
    existing.plan = plan
    existing.updatedAt = Date.now()
  } else {
    data.guilds.push({
      guildId: normalizedGuildId,
      active: true,
      plan,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  writePremiumFile(data)
  return true
}

function deactivatePremium(guildId) {
  const data = readPremiumFile()
  const normalizedGuildId = String(guildId)
  const existing = data.guilds.find(entry => entry.guildId === normalizedGuildId)

  if (!existing) return false

  existing.active = false
  existing.updatedAt = Date.now()

  writePremiumFile(data)
  return true
}

function getPremiumInfo(guildId) {
  const normalizedGuildId = String(guildId)

  if (isPremiumGuild(normalizedGuildId)) {
    return {
      guildId: normalizedGuildId,
      active: true,
      plan: "pro"
    }
  }

  const data = readPremiumFile()
  return data.guilds.find(entry => entry.guildId === normalizedGuildId) || null
}

function hasPremiumAccess({ guildId, userId }) {
  return isPremiumGuild(guildId) || isPremiumUser(userId)
}

module.exports = {
  isPremiumUser,
  isPremiumGuild,
  hasPremiumAccess,
  activatePremium,
  deactivatePremium,
  getPremiumInfo
}