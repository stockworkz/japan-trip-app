import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage, generateStoragePath } from '../utils/imageCompression'

export default function PhotoUpload({
  user,
  tripDates,
  days,
  initialDayDate,
  initialActivityId,
  onClose,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dayDate, setDayDate] = useState(initialDayDate || tripDates[0] || '')
  const [activityId, setActivityId] = useState(initialActivityId || '')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const selectedDay = days.find((day) => day.date === dayDate)
  const dayActivities = selectedDay?.activities || []

  function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setSelectedFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function handleUpload(event) {
    event.preventDefault()

    if (!selectedFile || !dayDate) {
      setError('Please select a photo and day')
      return
    }

    if (uploading) return

    setUploading(true)
    setError('')

    try {
      // Compress image if needed
      const compressedFile = await compressImage(selectedFile)

      // Generate storage path
      const storagePath = generateStoragePath(user.id, selectedFile.name)

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(storagePath, compressedFile, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        })

      if (uploadError) throw uploadError

      // Create metadata record
      const { error: dbError } = await supabase.from('trip_photos').insert({
        storage_path: storagePath,
        uploader_id: user.id,
        uploader_name: user.user_metadata?.display_name || 'Traveler',
        caption: caption.trim() || null,
        day_date: dayDate,
        activity_id: activityId || null,
      })

      if (dbError) throw dbError

      // Success
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload photo')
      setUploading(false)
    }
  }

  return (
    <form className="photo-upload-form" onSubmit={handleUpload}>
      <div className="form-field">
        <label htmlFor="photo-file">Photo *</label>
        <input
          id="photo-file"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          required
        />
      </div>

      {preview && (
        <div className="photo-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      <div className="form-field">
        <label htmlFor="photo-day">Day *</label>
        <select
          id="photo-day"
          value={dayDate}
          onChange={(e) => {
            setDayDate(e.target.value)
            setActivityId('') // Reset activity when day changes
          }}
          disabled={uploading}
          required
        >
          {tripDates.map((date) => {
            const day = days.find((d) => d.date === date)
            return (
              <option key={date} value={date}>
                {day?.displayDate || date} - {day?.city || ''}
              </option>
            )
          })}
        </select>
      </div>

      {dayActivities.length > 0 && (
        <div className="form-field">
          <label htmlFor="photo-activity">Activity (optional)</label>
          <select
            id="photo-activity"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            disabled={uploading}
          >
            <option value="">None</option>
            {dayActivities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="photo-caption">Caption (optional)</label>
        <textarea
          id="photo-caption"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={uploading || !selectedFile}
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
    </form>
  )
}
