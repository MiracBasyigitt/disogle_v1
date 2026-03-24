const { canModerateTarget } = require("./permissions")
const { addWarning, getWarnings, clearWarnings } = require("../storage/memory")
const { sendModLog } = require("../guild/logs")

async function warnMember({ message, target, reason }) {
  const guild = message.guild
  const executor = message.member

  if (!guild || !executor || !target) {
    return { ok: false, reply: "Invalid moderation context." }
  }

  const hierarchy = canModerateTarget(executor, target)
  if (!hierarchy.ok) {
    return { ok: false, reply: hierarchy.reason }
  }

  const list = addWarning(guild.id, target.id, {
    reason: reason || "No reason provided.",
    moderatorId: executor.id,
    timestamp: Date.now()
  })

  await sendModLog(guild, {
    title: "User Warned",
    moderator: `${executor.user.tag}`,
    target: `${target.user.tag}`,
    targetId: target.id,
    action: "Warn",
    reason: reason || "No reason provided.",
    channel: message.channel?.toString() || "Unknown"
  })

  return {
    ok: true,
    reply: `${target.user.tag} has been warned. Total warnings: ${list.length}.`
  }
}

async function listWarnings({ message, target }) {
  const guild = message.guild

  if (!guild || !target) {
    return { ok: false, reply: "Invalid warning lookup." }
  }

  const warnings = getWarnings(guild.id, target.id)

  if (!warnings.length) {
    return { ok: true, reply: `${target.user.tag} has no warnings.` }
  }

  const lines = warnings.slice(-10).map((warning, index) => {
    return `${index + 1}. ${warning.reason}`
  })

  return {
    ok: true,
    reply: `${target.user.tag} warnings:\n${lines.join("\n")}`
  }
}

async function resetWarnings({ message, target }) {
  const guild = message.guild
  const executor = message.member

  if (!guild || !executor || !target) {
    return { ok: false, reply: "Invalid warning reset request." }
  }

  clearWarnings(guild.id, target.id)

  await sendModLog(guild, {
    title: "Warnings Cleared",
    moderator: `${executor.user.tag}`,
    target: `${target.user.tag}`,
    targetId: target.id,
    action: "Clear Warnings",
    reason: "Warnings manually cleared.",
    channel: message.channel?.toString() || "Unknown"
  })

  return {
    ok: true,
    reply: `Cleared warnings for ${target.user.tag}.`
  }
}

module.exports = {
  warnMember,
  listWarnings,
  resetWarnings
}