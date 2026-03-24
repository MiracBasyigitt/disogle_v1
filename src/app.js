require("dotenv").config()

const fs = require("fs")
const path = require("path")
const client = require("./core/client")
const { logInfo, logError } = require("./core/logger")

process.on("unhandledRejection", error => {
  logError("Unhandled rejection:", error)
})

process.on("uncaughtException", error => {
  logError("Uncaught exception:", error)
})

process.on("uncaughtExceptionMonitor", error => {
  logError("Uncaught exception monitor:", error)
})

client.on("error", error => {
  logError("Discord client error:", error)
})

client.on("shardError", error => {
  logError("Shard error:", error)
})

logInfo("App started")

const eventsPath = path.join(__dirname, "events")
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"))

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file))

  if (!event || !event.name || !event.execute) continue

  if (event.once) {
    client.once(event.name, (...args) => {
      Promise.resolve(event.execute(...args)).catch(error => {
        logError(`Event ${event.name} failed:`, error)
      })
    })
  } else {
    client.on(event.name, (...args) => {
      Promise.resolve(event.execute(...args)).catch(error => {
        logError(`Event ${event.name} failed:`, error)
      })
    })
  }
}

client.login(process.env.DISCORD_TOKEN)
  .then(() => logInfo("Login request sent"))
  .catch(error => logError("Login error:", error))