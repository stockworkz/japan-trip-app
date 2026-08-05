export const STORAGE_KEY = 'japan-trip-app-state'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    // Clean up importedActivityState to remove status (now in Supabase)
    const importedActivityState = {}
    if (parsed.importedActivityState && typeof parsed.importedActivityState === 'object') {
      Object.keys(parsed.importedActivityState).forEach((key) => {
        const state = parsed.importedActivityState[key]
        if (state) {
          // Only keep rating and memory (status is now in Supabase)
          const { status, ...localState } = state
          if (Object.keys(localState).length > 0) {
            importedActivityState[key] = localState
          }
        }
      })
    }

    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      selectedDate:
        typeof parsed.selectedDate === 'string' ? parsed.selectedDate : null,
      importedActivityState,
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
