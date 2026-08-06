import { useState } from 'react'

export default function PhotoViewer({ photo, day, user, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const isOwner = photo.uploader_id === user?.id
  const uploadDate = new Date(photo.created_at)

  async function handleDelete() {
    if (!window.confirm('Delete this photo? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    const result = await onDelete(photo.id, photo.storage_path)
    
    if (result.error) {
      alert(`Delete failed: ${result.error}`)
      setDeleting(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="photo-viewer-backdrop" onClick={onClose}>
      <div className="photo-viewer" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="photo-viewer-close"
          onClick={onClose}
          aria-label="Close viewer"
        >
          ×
        </button>

        <div className="photo-viewer-image">
          <img src={photo.url} alt={photo.caption || 'Trip photo'} />
        </div>

        <div className="photo-viewer-info">
          <div className="photo-viewer-meta">
            <p className="photo-viewer-uploader">{photo.uploader_name}</p>
            <p className="photo-viewer-date">
              {day?.displayDate || photo.day_date} • {uploadDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
          
          {photo.caption && (
            <p className="photo-viewer-caption">{photo.caption}</p>
          )}

          {isOwner && (
            <button
              type="button"
              className="btn btn-danger photo-viewer-delete"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Photo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
