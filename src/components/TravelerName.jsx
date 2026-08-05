import { useState } from 'react'

export default function TravelerName({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ''
  )
  const [isSaving, setIsSaving] = useState(false)

  const currentName = user?.user_metadata?.display_name || 'Traveler'

  async function handleSave() {
    if (!displayName.trim()) return

    setIsSaving(true)
    const { error } = await onUpdate(displayName.trim())
    setIsSaving(false)

    if (!error) {
      setIsEditing(false)
    }
  }

  function handleCancel() {
    setDisplayName(currentName)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="traveler-name editing">
        <input
          type="text"
          className="traveler-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          placeholder="Your name"
          autoFocus
          disabled={isSaving}
        />
        <div className="traveler-actions">
          <button
            type="button"
            className="traveler-btn traveler-btn-save"
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="traveler-btn traveler-btn-cancel"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="traveler-name">
      <span className="traveler-display">{currentName}</span>
      <button
        type="button"
        className="traveler-edit-btn"
        onClick={() => setIsEditing(true)}
        aria-label="Edit name"
      >
        Edit
      </button>
    </div>
  )
}
