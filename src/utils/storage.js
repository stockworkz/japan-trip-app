export const STORAGE_KEY = 'japan-trip-app-state'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      selectedDate:
        typeof parsed.selectedDate === 'string' ? parsed.selectedDate : null,
      importedActivityState:
        parsed.importedActivityState &&
        typeof parsed.importedActivityState === 'object'
          ? parsed.importedActivityState
          : {},
      userActivities: Array.isArray(parsed.userActivities)
        ? parsed.userActivities
        : [],
      reflections:
        parsed.reflections && typeof parsed.reflections === 'object'
          ? parsed.reflections
          : {},
    }
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore quota or privacy errors for this milestone.
  }
}
