const { logError } = require("../core/logger")

async function safeExecute(label, fn) {
  try {
    return await fn()
  } catch (error) {
    logError(`${label} failed:`, error.message)
    return null
  }
}

module.exports = {
  safeExecute
}