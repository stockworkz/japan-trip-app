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
  return [...activities].sort((a, b) => {
    const aMinutes = parseTimeToMinutes(a.time)
    const bMinutes = parseTimeToMinutes(b.time)

    if (aMinutes !== null && bMinutes !== null) {
      return aMinutes - bMinutes
    }
    if (aMinutes !== null) return -1
    if (bMinutes !== null) return 1
    return a.title.localeCompare(b.title)
  })
}

export function formatActivityTime(activity) {
  if (activity.time) return activity.time
  if (activity.timeLabel) return activity.timeLabel
  return null
}
