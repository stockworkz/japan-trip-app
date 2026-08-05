import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook for managing shared activity locations (addresses and Apple Maps URLs)
 */
export function useActivityLocations(user) {
  const [locations, setLocations] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchLocations() {
      try {
        const { data, error: fetchError } = await supabase
          .from('activity_locations')
          .select('*')

        if (fetchError) throw fetchError

        // Convert array to object keyed by activity_id
        const locationsMap = {}
        data?.forEach((loc) => {
          locationsMap[loc.activity_id] = loc
        })

        setLocations(locationsMap)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching activity locations:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchLocations()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity_locations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_locations',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setLocations((prev) => ({
              ...prev,
              [payload.new.activity_id]: payload.new,
            }))
          } else if (payload.eventType === 'DELETE') {
            setLocations((prev) => {
              const updated = { ...prev }
              delete updated[payload.old.activity_id]
              return updated
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  /**
   * Save or update a location for an activity
   */
  async function saveLocation(activityId, { address, appleMapsUrl }) {
    if (!user) {
      return { error: 'No user logged in' }
    }

    if (!address && !appleMapsUrl) {
      return { error: 'Address or Apple Maps URL required' }
    }

    const locationData = {
      activity_id: activityId,
      address: address || null,
      apple_maps_url: appleMapsUrl || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    try {
      const { data, error: upsertError } = await supabase
        .from('activity_locations')
        .upsert(locationData, {
          onConflict: 'activity_id',
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      return { data, error: null }
    } catch (err) {
      console.error('Error saving location:', err)
      return { error: err.message }
    }
  }

  /**
   * Get location for a specific activity
   */
  function getLocation(activityId) {
    return locations[activityId] || null
  }

  return {
    locations,
    loading,
    error,
    getLocation,
    saveLocation,
  }
}
