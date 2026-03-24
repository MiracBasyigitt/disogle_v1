const { sendModLog } = require("./logs")

async function setSlowmode(message, seconds) {
  const channel = message.channel
  const guild = message.guild
  const executor = message.member

  if (!seconds || seconds < 0) {
    return { ok: false, reply: "Provide valid slowmode seconds." }
  }

  try {
    await channel.setRateLimitPerUser(seconds)

    await sendModLog(guild, {
      title: "Slowmode Set",
      moderator: executor.user.tag,
      action: "Slowmode",
      reason: `${seconds}s`,
      channel: channel.toString()
    })

    return { ok: true, reply: `Slowmode set to ${seconds}s.` }
  } catch {
    return { ok: false, reply: "Failed to set slowmode." }
  }
}

module.exports = { setSlowmode }