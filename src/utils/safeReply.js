const { logWarn } = require("../core/logger")

async function safeReply(message, content) {
  try {
    if (!message || !content) return false
    await message.reply(content)
    return true
  } catch (error) {
    logWarn("safeReply failed:", error.message)
    return false
  }
}

module.exports = {
  safeReply
}