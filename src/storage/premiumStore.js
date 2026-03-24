const fs = require("fs")
const path = require("path")

const FILE_PATH = path.join(__dirname, "premium.json")

function readPremiumFile() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ guilds: [] }, null, 2))
    }

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
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2))
}

function isPremiumGuild(guildId) {
  const data = readPremiumFile()
  return data.guilds.some(entry => entry.guildId === guildId && entry.active)
}

function activatePremium(guildId, plan = "pro") {
  const data = readPremiumFile()
  const existing = data.guilds.find(entry => entry.guildId === guildId)

  if (existing) {
    existing.active = true
    existing.plan = plan
    existing.updatedAt = Date.now()
  } else {
    data.guilds.push({
      guildId,
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
  const existing = data.guilds.find(entry => entry.guildId === guildId)

  if (!existing) return false

  existing.active = false
  existing.updatedAt = Date.now()

  writePremiumFile(data)
  return true
}

function getPremiumInfo(guildId) {
  const data = readPremiumFile()
  return data.guilds.find(entry => entry.guildId === guildId) || null
}

module.exports = {
  isPremiumGuild,
  activatePremium,
  deactivatePremium,
  getPremiumInfo
}