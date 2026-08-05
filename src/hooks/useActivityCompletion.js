import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useActivityCompletion(user) {
  const [completionState, setCompletionState] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchCompletionState() {
      try {
        const { data, error: fetchError } = await supabase
          .from('activity_completion')
          .select('activity_id, completed')

        if (fetchError) throw fetchError

        // Convert array to object keyed by activity_id
        const stateMap = {}
        if (data) {
          data.forEach((record) => {
            stateMap[record.activity_id] = record.completed
          })
        }

        setCompletionState(stateMap)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching activity completion:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchCompletionState()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity_completion_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_completion',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setCompletionState((prev) => ({
              ...prev,
              [payload.new.activity_id]: payload.new.completed,
            }))
          } else if (payload.eventType === 'DELETE') {
            setCompletionState((prev) => {
              const newState = { ...prev }
              delete newState[payload.old.activity_id]
              return newState
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  async function toggleCompletion(activityId, currentStatus) {
    if (!user) {
      return { error: 'No user logged in' }
    }

    const newStatus = !currentStatus

    // Optimistic update
    setCompletionState((prev) => ({
      ...prev,
      [activityId]: newStatus,
    }))

    try {
      const { error: upsertError } = await supabase
        .from('activity_completion')
        .upsert(
          {
            activity_id: activityId,
            completed: newStatus,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'activity_id',
          }
        )

      if (upsertError) throw upsertError

      return { error: null }
    } catch (err) {
      console.error('Error toggling activity completion:', err)

      // Revert optimistic update
      setCompletionState((prev) => ({
        ...prev,
        [activityId]: currentStatus,
      }))

      return { error: err.message }
    }
  }

  return {
    completionState,
    loading,
    error,
    toggleCompletion,
  }
}
