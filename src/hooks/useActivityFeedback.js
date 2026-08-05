import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { loadState } from '../utils/storage'

export function useActivityFeedback(user) {
  const [allFeedback, setAllFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasMigrated = useRef(false)

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

        // Migrate local memories to Supabase once
        if (!hasMigrated.current) {
          hasMigrated.current = true
          await migrateLocalMemories(data || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching activity feedback:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    async function migrateLocalMemories(existingFeedback) {
      try {
        const localState = loadState()
        if (!localState?.importedActivityState) return

        const memoriesToMigrate = []

        Object.entries(localState.importedActivityState).forEach(([activityId, state]) => {
          if (state.memory && state.memory.trim()) {
            // Check if user already has feedback for this activity
            const existing = existingFeedback.find(
              (fb) => fb.activity_id === activityId && fb.user_id === user.id
            )

            if (existing) {
              // Update existing feedback with memory
              if (!existing.memory) {
                memoriesToMigrate.push({
                  user_id: user.id,
                  activity_id: activityId,
                  rating: existing.rating,
                  is_favorite: existing.is_favorite,
                  memory: state.memory,
                  updated_at: new Date().toISOString(),
                })
              }
            } else {
              // Create new feedback with just memory
              memoriesToMigrate.push({
                user_id: user.id,
                activity_id: activityId,
                rating: null,
                is_favorite: false,
                memory: state.memory,
                updated_at: new Date().toISOString(),
              })
            }
          }
        })

        if (memoriesToMigrate.length > 0) {
          const { error: upsertError } = await supabase
            .from('activity_feedback')
            .upsert(memoriesToMigrate, {
              onConflict: 'user_id,activity_id',
            })

          if (upsertError) {
            console.error('Error migrating memories:', upsertError)
          }
        }
      } catch (err) {
        console.error('Migration error:', err)
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

  // Get all memories for an activity
  function getAllMemories(activityId) {
    return allFeedback
      .filter((item) => item.activity_id === activityId && item.memory)
      .map((item) => ({
        userId: item.user_id,
        memory: item.memory,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }))
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
      memory: existingFeedback?.memory || null,
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
      memory: existingFeedback?.memory || null,
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

  // Update memory
  async function setMemory(activityId, memory) {
    if (!user) {
      return { error: 'No user logged in' }
    }

    const existingFeedback = getUserFeedback(activityId)
    const newFeedback = {
      user_id: user.id,
      activity_id: activityId,
      rating: existingFeedback?.rating || null,
      is_favorite: existingFeedback?.is_favorite || false,
      memory: memory || null,
      updated_at: new Date().toISOString(),
    }

    // Optimistic update
    if (existingFeedback) {
      setAllFeedback((prev) =>
        prev.map((item) =>
          item.id === existingFeedback.id
            ? { ...item, memory, updated_at: newFeedback.updated_at }
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
      console.error('Error setting memory:', err)

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
    allFeedback, // Expose for Wrapped calculations
    getUserFeedback,
    getAllMemories,
    getAverageRating,
    getFavoriteCount,
    setRating,
    toggleFavorite,
    setMemory,
  }
}
