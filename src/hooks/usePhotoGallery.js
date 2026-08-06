import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePhotoGallery(user) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchPhotos() {
      try {
        const { data, error: fetchError } = await supabase
          .from('trip_photos')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        // Generate public URLs for each photo
        const photosWithUrls = data.map((photo) => {
          const { data: urlData } = supabase.storage
            .from('trip-photos')
            .getPublicUrl(photo.storage_path)

          return {
            ...photo,
            url: urlData.publicUrl,
          }
        })

        setPhotos(photosWithUrls)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching photos:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchPhotos()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('trip_photos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_photos',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: urlData } = supabase.storage
              .from('trip-photos')
              .getPublicUrl(payload.new.storage_path)

            setPhotos((prev) => [
              { ...payload.new, url: urlData.publicUrl },
              ...prev,
            ])
          } else if (payload.eventType === 'DELETE') {
            setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  async function deletePhoto(photoId, storagePath) {
    if (!user) {
      console.error('Delete failed: No user logged in')
      return { error: 'You must be logged in to delete photos' }
    }

    try {
      // Step 1: Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('trip-photos')
        .remove([storagePath])

      if (storageError) {
        console.error('Storage deletion failed:', storageError)
        throw new Error(`Failed to delete file: ${storageError.message}`)
      }

      // Step 2: Delete metadata from database
      const { error: dbError } = await supabase
        .from('trip_photos')
        .delete()
        .eq('id', photoId)
        .eq('uploader_id', user.id) // Double-check ownership

      if (dbError) {
        console.error('Database deletion failed:', dbError)
        throw new Error(`Failed to delete photo record: ${dbError.message}`)
      }

      return { error: null }
    } catch (err) {
      console.error('Photo deletion error:', err)
      return { 
        error: err.message || 'Failed to delete photo. Please try again.'
      }
    }
  }

  return {
    photos,
    loading,
    error,
    deletePhoto,
  }
}
