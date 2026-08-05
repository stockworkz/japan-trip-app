import { useMemo } from 'react'

/**
 * Calculate all Wrapped metrics from trip data
 */
export function useWrappedData({
  days = [],
  allActivities = [],
  completionState = {},
  photos = [],
  allFeedback = [],
  user = null,
}) {
  return useMemo(() => {
    // Ensure safe defaults for all inputs
    const safeDays = days || []
    const safeActivities = allActivities || []
    const safeCompletion = completionState || {}
    const safePhotos = photos || []
    const safeFeedback = allFeedback || []

    // Basic trip stats
    const tripDates = safeDays.map((d) => d.date)
    const uniqueCities = [...new Set(safeDays.map((d) => d.city))]
    const totalActivities = safeActivities.length
    const completedActivities = safeActivities.filter(
      (a) => safeCompletion[a.id]
    ).length
    const completionPercentage =
      totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0

    // Photo stats
    const totalPhotos = safePhotos.length

    // Get all unique travelers from photos and feedback
    const travelerSet = new Set()
    safePhotos.forEach((p) => {
      if (p.uploader_id) travelerSet.add(p.uploader_id)
    })
    safeFeedback.forEach((f) => {
      if (f.user_id) travelerSet.add(f.user_id)
    })

    // Get traveler names from photos and feedback
    const travelerNames = new Map()
    safePhotos.forEach((p) => {
      if (p.uploader_id && p.uploader_name) {
        travelerNames.set(p.uploader_id, p.uploader_name)
      }
    })
    // Feedback doesn't have display names, but we can get current user's
    if (user?.id && user?.user_metadata?.display_name) {
      travelerNames.set(user.id, user.user_metadata.display_name)
    }

    /**
     * Calculate favorite day score based on:
     * - Photos uploaded (2 points each)
     * - Activities completed (1 point each)
     * - Average ratings given (up to 5 points)
     * - Favorites marked (3 points each)
     */
    const dayScores = safeDays.map((day) => {
      const dayActivities = day.activities || []
      const dayActivityIds = new Set(dayActivities.map((a) => a.id))

      // Count photos for this day
      const dayPhotos = safePhotos.filter((p) => p.day_date === day.date).length

      // Count completed activities
      const dayCompleted = dayActivities.filter(
        (a) => safeCompletion[a.id]
      ).length

      // Calculate average rating for activities on this day
      const dayRatings = safeFeedback.filter(
        (f) => dayActivityIds.has(f.activity_id) && f.rating !== null
      )
      const avgRating =
        dayRatings.length > 0
          ? dayRatings.reduce((sum, f) => sum + f.rating, 0) / dayRatings.length
          : 0

      // Count favorites for this day
      const dayFavorites = safeFeedback.filter(
        (f) => dayActivityIds.has(f.activity_id) && f.is_favorite
      ).length

      const score = dayPhotos * 2 + dayCompleted * 1 + avgRating + dayFavorites * 3

      return {
        day,
        score,
        photos: dayPhotos,
        completed: dayCompleted,
        avgRating,
        favorites: dayFavorites,
      }
    })

    const favoriteDay = dayScores.length > 0
      ? dayScores.reduce((best, current) =>
          current.score > best.score ? current : best
        )
      : null

    // Get photos for favorite day
    const favoriteDayPhotos = favoriteDay
      ? safePhotos
          .filter((p) => p.day_date === favoriteDay.day.date)
          .slice(0, 3)
      : []

    /**
     * Top-rated activity:
     * - Highest average rating (requires at least 1 rating)
     * - Use rating count as tie-breaker
     */
    const activityRatings = safeActivities
      .map((activity) => {
        const ratings = safeFeedback.filter(
          (f) => f.activity_id === activity.id && f.rating !== null
        )
        if (ratings.length === 0) return null

        const avgRating =
          ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length
        const favoriteCount = safeFeedback.filter(
          (f) => f.activity_id === activity.id && f.is_favorite
        ).length

        const activityPhoto = safePhotos.find((p) => p.activity_id === activity.id)

        return {
          activity,
          avgRating,
          ratingCount: ratings.length,
          favoriteCount,
          photo: activityPhoto,
        }
      })
      .filter(Boolean)

    const topRatedActivity =
      activityRatings.length > 0
        ? activityRatings.reduce((best, current) => {
            if (current.avgRating > best.avgRating) return current
            if (
              current.avgRating === best.avgRating &&
              current.ratingCount > best.ratingCount
            )
              return current
            return best
          })
        : null

    /**
     * Most photographed moment:
     * - Activity with most photos
     * - Fall back to day with most photos if no activity has photos
     */
    const activityPhotoCounts = safeActivities.map((activity) => {
      const count = safePhotos.filter((p) => p.activity_id === activity.id).length
      return { activity, count }
    })

    const mostPhotographedActivity = activityPhotoCounts.length > 0
      ? activityPhotoCounts.reduce(
          (best, current) => (current.count > best.count ? current : best),
          { activity: null, count: 0 }
        )
      : { activity: null, count: 0 }

    const mostPhotographedMoment =
      mostPhotographedActivity.count > 0
        ? {
            type: 'activity',
            activity: mostPhotographedActivity.activity,
            count: mostPhotographedActivity.count,
            photos: safePhotos
              .filter((p) => p.activity_id === mostPhotographedActivity.activity.id)
              .slice(0, 4),
          }
        : favoriteDay && favoriteDay.photos > 0
        ? {
            type: 'day',
            day: favoriteDay.day,
            count: favoriteDay.photos,
            photos: favoriteDayPhotos,
          }
        : null

    /**
     * Group favorites:
     * - Top 3 activities by favorite count
     * - Use average rating as tie-breaker
     */
    const activityFavorites = safeActivities
      .map((activity) => {
        const favoriteCount = safeFeedback.filter(
          (f) => f.activity_id === activity.id && f.is_favorite
        ).length
        if (favoriteCount === 0) return null

        const ratings = safeFeedback.filter(
          (f) => f.activity_id === activity.id && f.rating !== null
        )
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length
            : 0

        const day = safeDays.find((d) =>
          (d.activities || []).some((a) => a.id === activity.id)
        )

        return {
          activity,
          favoriteCount,
          avgRating,
          ratingCount: ratings.length,
          day,
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.favoriteCount !== a.favoriteCount) {
          return b.favoriteCount - a.favoriteCount
        }
        return b.avgRating - a.avgRating
      })
      .slice(0, 3)

    /**
     * Traveler superlatives:
     * Calculate only when data supports them
     */
    const travelerStats = Array.from(travelerSet).map((userId) => {
      const name = travelerNames.get(userId) || 'Traveler'

      // Photo count
      const photoCount = safePhotos.filter((p) => p.uploader_id === userId).length

      // Rating stats
      const userRatings = safeFeedback.filter(
        (f) => f.user_id === userId && f.rating !== null
      )
      const ratingCount = userRatings.length
      const avgRating =
        ratingCount > 0
          ? userRatings.reduce((sum, f) => sum + f.rating, 0) / ratingCount
          : 0

      // Memory count
      const memoryCount = safeFeedback.filter(
        (f) => f.user_id === userId && f.memory && f.memory.trim()
      ).length

      return {
        userId,
        name,
        photoCount,
        ratingCount,
        avgRating,
        memoryCount,
      }
    })

    // Most prolific photographer (require at least 3 photos to avoid awkward singles)
    const photographerStats = travelerStats.filter((t) => t.photoCount >= 3)
    const topPhotographer =
      photographerStats.length > 0
        ? photographerStats.reduce((best, current) =>
            current.photoCount > best.photoCount ? current : best
          )
        : null

    // Most generous rater (require at least 5 ratings)
    const raterStats = travelerStats.filter((t) => t.ratingCount >= 5)
    const mostGenerousRater =
      raterStats.length > 0
        ? raterStats.reduce((best, current) =>
            current.ratingCount > best.ratingCount ? current : best
          )
        : null

    // Toughest critic (lowest average rating, require at least 3 ratings)
    const criticStats = travelerStats.filter((t) => t.ratingCount >= 3)
    const toughestCritic =
      criticStats.length > 0
        ? criticStats.reduce((best, current) =>
            current.avgRating < best.avgRating ? current : best
          )
        : null

    // Memory keeper (require at least 3 memories)
    const memoryStats = travelerStats.filter((t) => t.memoryCount >= 3)
    const memoryKeeper =
      memoryStats.length > 0
        ? memoryStats.reduce((best, current) =>
            current.memoryCount > best.memoryCount ? current : best
          )
        : null

    /**
     * Curated memories:
     * - Mix of travelers and activities
     * - Limit to 6 for readability
     */
    const allMemories = safeFeedback
      .filter((f) => f.memory && f.memory.trim())
      .map((f) => {
        const activity = safeActivities.find((a) => a.id === f.activity_id)
        const travelerName = travelerNames.get(f.user_id) || 'Traveler'
        return {
          memory: f.memory,
          travelerName,
          userId: f.user_id,
          activityTitle: activity?.title || 'Unknown activity',
        }
      })

    // Try to get a diverse mix of travelers
    const curatedMemories = []
    const seenTravelers = new Set()

    // First pass: one memory per traveler
    for (const memory of allMemories) {
      if (!seenTravelers.has(memory.userId) && curatedMemories.length < 6) {
        curatedMemories.push(memory)
        seenTravelers.add(memory.userId)
      }
    }

    // Second pass: fill remaining slots
    for (const memory of allMemories) {
      if (
        !curatedMemories.includes(memory) &&
        curatedMemories.length < 6
      ) {
        curatedMemories.push(memory)
      }
    }

    // Hero photos for opening card (up to 4)
    const heroPhotos = safePhotos.slice(0, 4)

    // Final collage photos (6-9 photos)
    const collagePhotos = safePhotos.slice(0, 9)

    return {
      // Overview
      tripDates,
      uniqueCities: uniqueCities.length,
      totalActivities,
      completedActivities,
      completionPercentage,
      totalPhotos,
      travelerNames: Array.from(travelerNames.values()),

      // Featured moments
      favoriteDay,
      favoriteDayPhotos,
      topRatedActivity,
      mostPhotographedMoment,
      groupFavorites: activityFavorites,

      // Superlatives
      topPhotographer,
      mostGenerousRater,
      toughestCritic,
      memoryKeeper,

      // Memories
      curatedMemories,

      // Photos
      heroPhotos,
      collagePhotos,
    }
  }, [days, allActivities, completionState, photos, allFeedback, user])
}
