/**
 * Generate an Apple Maps URL for an activity
 * 
 * Resolution order:
 * 1. Shared apple_maps_url from activity_locations
 * 2. activity.appleMapsUrl (direct Apple Maps URL)
 * 3. Existing Apple Maps activity.mapUrl
 * 4. Shared address from activity_locations
 * 5. activity.address
 * 6. Trusted activity.location (must be specific)
 * 
 * No fallback to activity title - only trusted destinations
 * 
 * @param {Object} activity - Activity object
 * @param {Object} sharedLocation - Shared location from Supabase (optional)
 * @returns {string|null} Apple Maps URL or null if no valid destination
 */
export function getAppleMapsUrl(activity, sharedLocation = null) {
  if (!activity) return null

  // 1. Check for shared Apple Maps URL
  if (sharedLocation?.apple_maps_url) {
    return sharedLocation.apple_maps_url
  }

  // 2. Check for direct Apple Maps URL in activity
  if (activity.appleMapsUrl) {
    return activity.appleMapsUrl
  }

  // 3. Check if mapUrl is already an Apple Maps URL
  if (activity.mapUrl) {
    const url = activity.mapUrl.toLowerCase()
    if (url.includes('maps.apple.com') || url.includes('apple.com/maps')) {
      return activity.mapUrl
    }
  }

  // 4-6. Build search query from trusted destinations only
  let destination = null

  if (sharedLocation?.address) {
    destination = sharedLocation.address
  } else if (activity.address) {
    destination = activity.address
  } else if (activity.location && activity.location.trim()) {
    // Only trust location if it exists and is not empty
    destination = activity.location
  }

  // If we have a destination, create Apple Maps search URL
  if (destination) {
    const encoded = encodeURIComponent(destination.trim())
    return `https://maps.apple.com/?q=${encoded}`
  }

  return null
}

/**
 * Check if an activity has a valid trusted destination for navigation
 * 
 * @param {Object} activity - Activity object
 * @param {Object} sharedLocation - Shared location from Supabase (optional)
 * @returns {boolean} True if activity has a trusted destination
 */
export function canNavigate(activity, sharedLocation = null) {
  if (!activity) return false
  
  return !!(
    sharedLocation?.apple_maps_url ||
    sharedLocation?.address ||
    activity.appleMapsUrl ||
    activity.mapUrl ||
    activity.address ||
    (activity.location && activity.location.trim())
  )
}
