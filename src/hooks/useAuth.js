import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function initializeAuth() {
      try {
        // Check for existing session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (session?.user) {
          setUser(session.user)
          setLoading(false)
          return
        }

        // No session exists, sign in anonymously
        const { data, error: signInError } = await supabase.auth.signInAnonymously()

        if (signInError) throw signInError

        if (!data?.user) {
          throw new Error('Anonymous sign-in returned no user')
        }

        setUser(data.user)
        setLoading(false)
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function updateDisplayName(displayName) {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })

      if (error) throw error

      setUser(data.user)
      return { data, error: null }
    } catch (err) {
      console.error('Update display name error:', err)
      return { data: null, error: err.message }
    }
  }

  return {
    user,
    loading,
    error,
    updateDisplayName,
  }
}
