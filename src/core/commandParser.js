const { parseDuration } = require("../utils/duration")

function normalizeInput(content = "") {
  return String(content)
    .toLowerCase()
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function isBotCalled(content = "") {
  const text = normalizeInput(content)

  return (
    text.startsWith("disogle") ||
    text.startsWith("@disogle") ||
    text.includes(" disogle ") ||
    text.includes("<@")
  )
}

function detectIntent(content = "") {
  const text = normalizeInput(content)

  if (/\bclear warnings\b|\breset warnings\b/.test(text)) return "clear_warnings"
  if (/\bwarnings\b/.test(text)) return "warnings"
  if (/\bunmute\b|\buntimeout\b|\bremove timeout\b/.test(text)) return "unmute"
  if (/\bmute\b|\btimeout\b|\bsilence\b/.test(text)) return "mute"
  if (/\bwarn\b|\bwarning\b/.test(text)) return "warn"
  if (/\bban\b/.test(text)) return "ban"
  if (/\bkick\b/.test(text)) return "kick"
  if (/\bunlock\b/.test(text)) return "unlock"
  if (/\block\b/.test(text)) return "lock"
  if (/\bslowmode\b/.test(text)) return "slowmode"

  return null
}

function extractReason(content = "", intent = null) {
  const text = String(content).trim()

  const explicitReason = text.match(/\b(?:for|reason)\b[:\s]+(.+)$/i)
  if (explicitReason?.[1]) {
    const value = explicitReason[1].trim()
    if (value) return value
  }

  if (!intent) return null

  const patterns = {
    mute: /\bmute\b.+?\b(?:\d+\s*[a-z]+)?\s*(.+)$/i,
    unmute: /\bunmute\b.+?\s+(.+)$/i,
    warn: /\bwarn\b.+?\s+(.+)$/i,
    ban: /\bban\b.+?\s+(.+)$/i,
    kick: /\bkick\b.+?\s+(.+)$/i,
    slowmode: /\bslowmode\b.+?\s+(.+)$/i
  }

  const pattern = patterns[intent]
  if (!pattern) return null

  const match = text.match(pattern)
  if (!match?.[1]) return null

  const cleaned = match[1]
    .replace(/^\d+\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)\b/i, "")
    .trim()

  if (!cleaned) return null

  const junk = [
    "this",
    "here",
    "channel",
    "user",
    "member",
    "please"
  ]

  if (junk.includes(cleaned.toLowerCase())) return null

  return cleaned
}

function extractRawNumberSeconds(content = "") {
  const text = normalizeInput(content)

  const slowmodeMatch = text.match(/\bslowmode\b(?:\s+to)?\s+(\d+)\b/)
  if (slowmodeMatch?.[1]) {
    return Number(slowmodeMatch[1])
  }

  return null
}

function parseModerationCommand(message) {
  const content = message?.content || ""

  if (!isBotCalled(content)) return null

  const intent = detectIntent(content)
  if (!intent) return null

  const target = message.mentions.members.first() || null

  let durationMs = parseDuration(content)

  if (!durationMs && intent === "slowmode") {
    const rawSeconds = extractRawNumberSeconds(content)
    if (Number.isFinite(rawSeconds) && rawSeconds >= 0) {
      durationMs = rawSeconds * 1000
    }
  }

  const reason = extractReason(content, intent)

  return {
    intent,
    target,
    durationMs,
    reason,
    raw: content
  }
}

module.exports = {
  normalizeInput,
  isBotCalled,
  detectIntent,
  parseModerationCommand
}