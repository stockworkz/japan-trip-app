import { useCallback, useEffect, useMemo, useState } from 'react'
import { itinerary } from '../data/itinerary'
import { sortActivities } from '../utils/activitySorting'
import { loadState, saveState } from '../utils/storage'

const TRIP_DATES = itinerary.map((day) => day.date)

function generateActivityId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeUserActivity(activity) {
  return {
    id: activity.id,
    date: activity.date,
    time: activity.time || '',
    timeLabel: activity.timeLabel || null,
    title: activity.title,
    city: activity.city || '',
    type: activity.type || 'activity',
    location: activity.location || '',
    notes: activity.notes || '',
    source: 'user',
    status: activity.status || 'planned',
    rating: activity.rating ?? null,
    memory: activity.memory || '',
    photos: Array.isArray(activity.photos) ? activity.photos : [],
  }
}

function mergeImportedActivities(importedActivityState) {
  return itinerary.flatMap((day) =>
    day.activities.map((activity) => {
      const saved = importedActivityState[activity.id]
      if (!saved) return { ...activity }

      return {
        ...activity,
        status: saved.status ?? activity.status,
        rating: saved.rating ?? activity.rating,
        memory: saved.memory ?? activity.memory,
      }
    }),
  )
}

function buildAllActivities(importedActivityState, userActivities) {
  const imported = mergeImportedActivities(importedActivityState)
  const user = userActivities.map(normalizeUserActivity)
  return sortActivities([...imported, ...user])
}

function getActivitiesForDate(allActivities, date) {
  return allActivities.filter((activity) => activity.date === date)
}

function getDefaultSelectedDate(storedDate) {
  if (storedDate && TRIP_DATES.includes(storedDate)) return storedDate
  return TRIP_DATES[0]
}

function createEmptyForm(date, city) {
  return {
    title: '',
    date,
    time: '',
    timeLabel: '',
    city: city || '',
    type: 'activity',
    location: '',
    notes: '',
  }
}

export function useTripState() {
  const [persisted, setPersisted] = useState(() => {
    const stored = loadState()
    return {
      version: 1,
      selectedDate: getDefaultSelectedDate(stored?.selectedDate),
      importedActivityState: stored?.importedActivityState ?? {},
      userActivities: (stored?.userActivities ?? []).map(normalizeUserActivity),
      reflections: stored?.reflections ?? {},
    }
  })

  useEffect(() => {
    saveState(persisted)
  }, [persisted])

  const allActivities = useMemo(
    () =>
      buildAllActivities(
        persisted.importedActivityState,
        persisted.userActivities,
      ),
    [persisted.importedActivityState, persisted.userActivities],
  )

  const days = useMemo(
    () =>
      itinerary.map((day) => ({
        ...day,
        activities: getActivitiesForDate(allActivities, day.date),
      })),
    [allActivities],
  )

  const selectedDay =
    days.find((day) => day.date === persisted.selectedDate) ?? days[0]

  const dayIndex = days.findIndex((day) => day.date === selectedDay.date)

  const nextActivity =
    selectedDay.activities.find((activity) => activity.status !== 'complete') ??
    null

  const tripProgress = useMemo(() => {
    const total = allActivities.length
    const completed = allActivities.filter(
      (activity) => activity.status === 'complete',
    ).length
    return { completed, total }
  }, [allActivities])

  const dayProgress = useMemo(() => {
    const total = selectedDay.activities.length
    const completed = selectedDay.activities.filter(
      (activity) => activity.status === 'complete',
    ).length
    return { completed, total }
  }, [selectedDay.activities])

  const setSelectedDate = useCallback((date) => {
    if (!TRIP_DATES.includes(date)) return
    setPersisted((prev) => ({ ...prev, selectedDate: date }))
  }, [])

  const goToPreviousDay = useCallback(() => {
    setPersisted((prev) => {
      const index = TRIP_DATES.indexOf(prev.selectedDate)
      if (index <= 0) return prev
      return { ...prev, selectedDate: TRIP_DATES[index - 1] }
    })
  }, [])

  const goToNextDay = useCallback(() => {
    setPersisted((prev) => {
      const index = TRIP_DATES.indexOf(prev.selectedDate)
      if (index < 0 || index >= TRIP_DATES.length - 1) return prev
      return { ...prev, selectedDate: TRIP_DATES[index + 1] }
    })
  }, [])

  const updateActivity = useCallback((activityId, updates) => {
    setPersisted((prev) => {
      const userIndex = prev.userActivities.findIndex(
        (activity) => activity.id === activityId,
      )

      if (userIndex >= 0) {
        const userActivities = [...prev.userActivities]
        userActivities[userIndex] = normalizeUserActivity({
          ...userActivities[userIndex],
          ...updates,
        })
        return { ...prev, userActivities }
      }

      const importedActivityState = {
        ...prev.importedActivityState,
        [activityId]: {
          ...prev.importedActivityState[activityId],
          ...updates,
        },
      }

      return { ...prev, importedActivityState }
    })
  }, [])

  const toggleActivityComplete = useCallback(
    (activityId) => {
      const activity = allActivities.find((item) => item.id === activityId)
      if (!activity) return

      const nextStatus =
        activity.status === 'complete' ? 'planned' : 'complete'
      updateActivity(activityId, { status: nextStatus })
    },
    [allActivities, updateActivity],
  )

  const setActivityRating = useCallback(
    (activityId, rating) => {
      updateActivity(activityId, { rating })
    },
    [updateActivity],
  )

  const setActivityMemory = useCallback(
    (activityId, memory) => {
      updateActivity(activityId, { memory })
    },
    [updateActivity],
  )

  const addActivity = useCallback((formData) => {
    const title = formData.title.trim()
    if (!title || !formData.date) return false

    const newActivity = normalizeUserActivity({
      id: generateActivityId(),
      date: formData.date,
      time: formData.time.trim(),
      timeLabel: formData.timeLabel.trim() || null,
      title,
      city: formData.city.trim(),
      type: formData.type || 'activity',
      location: formData.location.trim(),
      notes: formData.notes.trim(),
      status: 'planned',
      rating: null,
      memory: '',
      photos: [],
    })

    setPersisted((prev) => ({
      ...prev,
      userActivities: [...prev.userActivities, newActivity],
    }))

    return true
  }, [])

  const editActivity = useCallback((activityId, formData) => {
    const title = formData.title.trim()
    if (!title || !formData.date) return false

    setPersisted((prev) => {
      const userIndex = prev.userActivities.findIndex(
        (activity) => activity.id === activityId,
      )
      if (userIndex < 0) return prev

      const userActivities = [...prev.userActivities]
      userActivities[userIndex] = normalizeUserActivity({
        ...userActivities[userIndex],
        date: formData.date,
        time: formData.time.trim(),
        timeLabel: formData.timeLabel.trim() || null,
        title,
        city: formData.city.trim(),
        type: formData.type || 'activity',
        location: formData.location.trim(),
        notes: formData.notes.trim(),
      })

      return { ...prev, userActivities }
    })

    return true
  }, [])

  const deleteActivity = useCallback((activityId) => {
    setPersisted((prev) => ({
      ...prev,
      userActivities: prev.userActivities.filter(
        (activity) => activity.id !== activityId,
      ),
    }))
  }, [])

  const setReflection = useCallback((date, answer) => {
    setPersisted((prev) => ({
      ...prev,
      reflections: {
        ...prev.reflections,
        [date]: answer,
      },
    }))
  }, [])

  return {
    days,
    tripDates: TRIP_DATES,
    selectedDay,
    dayIndex,
    nextActivity,
    tripProgress,
    dayProgress,
    reflections: persisted.reflections,
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    toggleActivityComplete,
    setActivityRating,
    setActivityMemory,
    addActivity,
    editActivity,
    deleteActivity,
    setReflection,
    createEmptyForm,
  }
}

export { TRIP_DATES }
