const DURATION_REGEX = /(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)/gi

function parseDuration(input = "") {
  if (!input || typeof input !== "string") {
    return null
  }

  let totalMs = 0
  let match

  while ((match = DURATION_REGEX.exec(input)) !== null) {
    const value = Number(match[1])
    const unit = match[2].toLowerCase()

    if (!Number.isFinite(value) || value <= 0) continue

    if (["s", "sec", "secs", "second", "seconds"].includes(unit)) {
      totalMs += value * 1000
      continue
    }

    if (["m", "min", "mins", "minute", "minutes"].includes(unit)) {
      totalMs += value * 60 * 1000
      continue
    }

    if (["h", "hr", "hrs", "hour", "hours"].includes(unit)) {
      totalMs += value * 60 * 60 * 1000
      continue
    }

    if (["d", "day", "days"].includes(unit)) {
      totalMs += value * 24 * 60 * 60 * 1000
    }
  }

  if (totalMs <= 0) return null
  return totalMs
}

function formatDuration(ms = 0) {
  if (!ms || ms < 1000) return "0s"

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []

  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (seconds) parts.push(`${seconds}s`)

  return parts.join(" ")
}

module.exports = {
  parseDuration,
  formatDuration
}