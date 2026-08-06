import rawData from './japan-itinerary-2026.json'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function formatDisplayDate(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

function mapActivityType(jsonType) {
  const typeMap = {
    'travel': 'transport',
    'explore': 'sightseeing',
    'nightlife': 'optional',
    'park': 'sightseeing',
    'break': 'accommodation',
    'lodging': 'accommodation'
  }
  return typeMap[jsonType] || jsonType
}

function determineScheduleType(activity) {
  // Fixed events: reservations, exact times, travel with times, lodging with times
  if (activity.reservation === true) return 'fixed'
  
  if (activity.time && activity.time.match(/^\d{1,2}:\d{2}$/)) {
    // Has exact time like "14:30"
    return 'fixed'
  }
  
  if (activity.timeLabel && activity.timeLabel.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)) {
    // Has formatted time like "2:30 PM" or "10:01 AM"
    const isFlexibleType = ['food', 'shopping', 'sightseeing'].includes(activity.type)
    if (!isFlexibleType || activity.reservation) {
      return 'fixed'
    }
  }
  
  // Check-in and travel with specific times are fixed
  if ((activity.type === 'lodging' || activity.type === 'travel') && activity.timeLabel) {
    return 'fixed'
  }
  
  return 'flexible'
}

function getLodgingForDay(date, lodgingArray) {
  const lodging = lodgingArray.find(
    (item) => item.checkIn === date
  )
  
  if (!lodging) return null
  
  return {
    name: lodging.name || null,
    type: lodging.type || null,
    location: lodging.city || null,
    checkIn: lodging.checkInTime || null,
    checkOut: null,
    url: lodging.url || null,
    notes: ''
  }
}

function transformActivity(activity, dayDate, dayCity, sortOrder) {
  const scheduleType = determineScheduleType(activity)
  
  return {
    id: activity.id,
    date: dayDate,
    time: activity.timeLabel || '',
    timeLabel: activity.timeLabel || null,
    title: activity.title,
    city: dayCity,
    type: mapActivityType(activity.type),
    location: activity.location || '',
    notes: activity.notes || '',
    source: 'imported',
    status: 'planned',
    rating: null,
    memory: '',
    photos: [],
    scheduleType,
    sortOrder,
    optional: activity.optional === true,
    needsConfirmation: activity.needsConfirmation === true,
    reservation: activity.reservation === true
  }
}

export const itinerary = rawData.days.map((day) => ({
  date: day.date,
  displayDate: formatDisplayDate(day.date),
  city: day.city,
  lodging: getLodgingForDay(day.date, rawData.lodging),
  activities: day.activities.map((activity, index) =>
    transformActivity(activity, day.date, day.city, index)
  )
}))
