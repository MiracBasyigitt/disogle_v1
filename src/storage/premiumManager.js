const fs = require("fs")

const PATH = "./premium.json"

function getData() {
  return JSON.parse(fs.readFileSync(PATH))
}

function saveData(data) {
  fs.writeFileSync(PATH, JSON.stringify(data, null, 2))
}

function isPremiumUser(id) {
  const data = getData()
  return data.users.includes(id)
}

function isPremiumGuild(id) {
  const data = getData()
  return data.guilds.includes(id)
}

function addPremiumUser(id) {
  const data = getData()
  if (!data.users.includes(id)) {
    data.users.push(id)
    saveData(data)
  }
}

function addPremiumGuild(id) {
  const data = getData()
  if (!data.guilds.includes(id)) {
    data.guilds.push(id)
    saveData(data)
  }
}

function removePremiumGuild(id) {
  const data = getData()
  data.guilds = data.guilds.filter(g => g !== id)
  saveData(data)
}

module.exports = {
  isPremiumUser,
  isPremiumGuild,
  addPremiumUser,
  addPremiumGuild,
  removePremiumGuild
}