import { useState } from 'react'

export default function AddLocationModal({ activity, existingLocation, onSave, onClose }) {
  const [address, setAddress] = useState(existingLocation?.address || '')
  const [appleMapsUrl, setAppleMapsUrl] = useState(existingLocation?.apple_maps_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!address.trim() && !appleMapsUrl.trim()) {
      setError('Please enter an address or Apple Maps URL')
      return
    }

    setSaving(true)
    setError('')

    const result = await onSave(activity.id, {
      address: address.trim() || null,
      appleMapsUrl: appleMapsUrl.trim() || null,
    })

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <form className="add-location-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="location-address">
          Address or Location Name
        </label>
        <input
          id="location-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., 1-18-8 Kabukicho, Shinjuku"
          disabled={saving}
        />
        <p className="field-hint">
          The specific street address or venue name
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="location-maps-url">
          Apple Maps URL (optional)
        </label>
        <input
          id="location-maps-url"
          type="url"
          value={appleMapsUrl}
          onChange={(e) => setAppleMapsUrl(e.target.value)}
          placeholder="https://maps.apple.com/?q=..."
          disabled={saving}
        />
        <p className="field-hint">
          Paste a URL from Apple Maps for exact location
        </p>
      </div>

      {error && (
        <p className="form-error">{error}</p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : existingLocation ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  )
}
