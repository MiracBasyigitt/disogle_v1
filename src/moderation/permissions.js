const { PermissionFlagsBits } = require("discord.js")

function hasModerationAccess(member) {
  if (!member || !member.permissions) return false

  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels)
  )
}

function botHasPermission(guild, permission) {
  const me = guild?.members?.me
  if (!me || !me.permissions) return false
  return me.permissions.has(permission)
}

function canModerateTarget(executor, target) {
  if (!executor || !target || !executor.guild) {
    return {
      ok: false,
      reason: "Invalid executor or target."
    }
  }

  if (executor.id === target.id) {
    return {
      ok: false,
      reason: "You cannot moderate yourself."
    }
  }

  if (target.user?.bot) {
    return {
      ok: false,
      reason: "Bots cannot be moderated with this action."
    }
  }

  if (target.id === executor.guild.ownerId) {
    return {
      ok: false,
      reason: "You cannot moderate the server owner."
    }
  }

  const me = executor.guild.members.me
  if (!me) {
    return {
      ok: false,
      reason: "Bot member data is unavailable."
    }
  }

  if (executor.id !== executor.guild.ownerId && executor.roles.highest.position <= target.roles.highest.position) {
    return {
      ok: false,
      reason: "Your highest role must be above the target's highest role."
    }
  }

  if (me.roles.highest.position <= target.roles.highest.position) {
    return {
      ok: false,
      reason: "My highest role must be above the target's highest role."
    }
  }

  return { ok: true }
}

module.exports = {
  hasModerationAccess,
  botHasPermission,
  canModerateTarget
}