function parseTimeToMinutes(time) {
  if (!time || typeof time !== 'string') return null

  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  if (period === 'AM') {
    if (hours === 12) hours = 0
  } else if (hours !== 12) {
    hours += 12
  }

  return hours * 60 + minutes
}

export function sortActivities(activities) {
  // Sort by sortOrder (original JSON position) to preserve natural flow
  return [...activities].sort((a, b) => {
    const aOrder = a.sortOrder ?? 999
    const bOrder = b.sortOrder ?? 999
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    
    // Fallback to title if sortOrder is equal (for user-created activities)
    return a.title.localeCompare(b.title)
  })
}

export function formatActivityTime(activity) {
  if (activity.time) return activity.time
  if (activity.timeLabel) return activity.timeLabel
  return null
}

export function getFixedActivities(activities) {
  return activities.filter(activity => activity.scheduleType === 'fixed')
}
