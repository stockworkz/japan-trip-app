import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useActivityFeedback(user) {
  const [allFeedback, setAllFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchFeedback() {
      try {
        const { data, error: fetchError } = await supabase
          .from('activity_feedback')
          .select('*')

        if (fetchError) throw fetchError

        setAllFeedback(data || [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching activity feedback:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchFeedback()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity_feedback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_feedback',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAllFeedback((prev) => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setAllFeedback((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setAllFeedback((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  // Get current user's feedback by activity ID
  function getUserFeedback(activityId) {
    if (!user) return null
    return allFeedback.find(
      (item) => item.activity_id === activityId && item.user_id === user.id
    )
  }

  // Calculate average rating for an activity
  function getAverageRating(activityId) {
    const ratings = allFeedback
      .filter(
        (item) => item.activity_id === activityId && item.rating !== null
      )
      .map((item) => item.rating)

    if (ratings.length === 0) return null

    const sum = ratings.reduce((acc, rating) => acc + rating, 0)
    return {
      average: sum / ratings.length,
      count: ratings.length,
    }
  }

  // Get favorite count for an activity
  function getFavoriteCount(activityId) {
    return allFeedback.filter(
      (item) => item.activity_id === activityId && item.is_favorite
    ).length
  }

  // Upsert rating
  async function setRating(activityId, rating) {
    if (!user) {
      return { error: 'No user logged in' }
    }

    const existingFeedback = getUserFeedback(activityId)
    const newFeedback = {
      user_id: user.id,
      activity_id: activityId,
      rating,
      is_favorite: existingFeedback?.is_favorite || false,
      updated_at: new Date().toISOString(),
    }

    // Optimistic update
    if (existingFeedback) {
      setAllFeedback((prev) =>
        prev.map((item) =>
          item.id === existingFeedback.id
            ? { ...item, rating, updated_at: newFeedback.updated_at }
            : item
        )
      )
    } else {
      const tempId = `temp-${Date.now()}`
      setAllFeedback((prev) => [...prev, { id: tempId, ...newFeedback }])
    }

    try {
      const { data, error: upsertError } = await supabase
        .from('activity_feedback')
        .upsert(newFeedback, {
          onConflict: 'user_id,activity_id',
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      // Replace temp with real data
      if (!existingFeedback) {
        setAllFeedback((prev) =>
          prev.map((item) =>
            item.id.toString().startsWith('temp-') &&
            item.activity_id === activityId &&
            item.user_id === user.id
              ? data
              : item
          )
        )
      }

      return { error: null }
    } catch (err) {
      console.error('Error setting rating:', err)

      // Revert optimistic update
      if (existingFeedback) {
        setAllFeedback((prev) =>
          prev.map((item) =>
            item.id === existingFeedback.id ? existingFeedback : item
          )
        )
      } else {
        setAllFeedback((prev) =>
          prev.filter(
            (item) =>
              !(
                item.id.toString().startsWith('temp-') &&
                item.activity_id === activityId
              )
          )
        )
      }

      return { error: err.message }
    }
  }

  // Toggle favorite
  async function toggleFavorite(activityId) {
    if (!user) {
      return { error: 'No user logged in' }
    }

    const existingFeedback = getUserFeedback(activityId)
    const newIsFavorite = !existingFeedback?.is_favorite
    const newFeedback = {
      user_id: user.id,
      activity_id: activityId,
      rating: existingFeedback?.rating || null,
      is_favorite: newIsFavorite,
      updated_at: new Date().toISOString(),
    }

    // Optimistic update
    if (existingFeedback) {
      setAllFeedback((prev) =>
        prev.map((item) =>
          item.id === existingFeedback.id
            ? { ...item, is_favorite: newIsFavorite, updated_at: newFeedback.updated_at }
            : item
        )
      )
    } else {
      const tempId = `temp-${Date.now()}`
      setAllFeedback((prev) => [...prev, { id: tempId, ...newFeedback }])
    }

    try {
      const { data, error: upsertError } = await supabase
        .from('activity_feedback')
        .upsert(newFeedback, {
          onConflict: 'user_id,activity_id',
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      // Replace temp with real data
      if (!existingFeedback) {
        setAllFeedback((prev) =>
          prev.map((item) =>
            item.id.toString().startsWith('temp-') &&
            item.activity_id === activityId &&
            item.user_id === user.id
              ? data
              : item
          )
        )
      }

      return { error: null }
    } catch (err) {
      console.error('Error toggling favorite:', err)

      // Revert optimistic update
      if (existingFeedback) {
        setAllFeedback((prev) =>
          prev.map((item) =>
            item.id === existingFeedback.id ? existingFeedback : item
          )
        )
      } else {
        setAllFeedback((prev) =>
          prev.filter(
            (item) =>
              !(
                item.id.toString().startsWith('temp-') &&
                item.activity_id === activityId
              )
          )
        )
      }

      return { error: err.message }
    }
  }

  return {
    loading,
    error,
    getUserFeedback,
    getAverageRating,
    getFavoriteCount,
    setRating,
    toggleFavorite,
  }
}
