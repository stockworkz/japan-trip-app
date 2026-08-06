import { useState } from 'react'
import PhotoViewer from './PhotoViewer'

export default function PhotoGallery({
  photos,
  loading,
  error,
  tripDates,
  days,
  user,
  onDelete,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [filterDay, setFilterDay] = useState('')

  const filteredPhotos = filterDay
    ? photos.filter((p) => p.day_date === filterDay)
    : photos

  if (loading) {
    return (
      <div className="photo-gallery-loading">
        <div className="loading-spinner" />
        <p>Loading photos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="photo-gallery-error">
        <p className="error-title">Error Loading Photos</p>
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="photo-gallery-empty">
        <p className="empty-title">No photos yet</p>
        <p className="empty-message">
          Be the first to capture a moment from this trip!
        </p>
      </div>
    )
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-filters">
        <select
          className="day-filter"
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
        >
          <option value="">All days</option>
          {tripDates.map((date) => {
            const day = days.find((d) => d.date === date)
            const count = photos.filter((p) => p.day_date === date).length
            return (
              <option key={date} value={date}>
                {day?.displayDate || date} ({count})
              </option>
            )
          })}
        </select>
      </div>

      <div className="photo-grid">
        {filteredPhotos.map((photo) => {
          const day = days.find((d) => d.date === photo.day_date)
          const isOwner = photo.uploader_id === user?.id

          return (
            <div key={photo.id} className="photo-card">
              <button
                type="button"
                className="photo-thumbnail"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img src={photo.url} alt={photo.caption || 'Trip photo'} loading="lazy" />
              </button>
              <div className="photo-info">
                <p className="photo-uploader">{photo.uploader_name}</p>
                {photo.caption && (
                  <p className="photo-caption">{photo.caption}</p>
                )}
                <p className="photo-day">{day?.displayDate || photo.day_date}</p>
                {isOwner && (
                  <button
                    type="button"
                    className="photo-delete-btn"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!window.confirm('Delete this photo? This cannot be undone.')) {
                        return
                      }
                      
                      const result = await onDelete(photo.id, photo.storage_path)
                      if (result.error) {
                        alert(`Delete failed: ${result.error}`)
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          day={days.find((d) => d.date === selectedPhoto.day_date)}
          user={user}
          onClose={() => setSelectedPhoto(null)}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
