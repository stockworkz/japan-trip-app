import { useState } from 'react'

const ACTIVITY_TYPES = [
  'activity',
  'transport',
  'food',
  'sightseeing',
  'shopping',
  'accommodation',
  'optional',
]

export default function ActivityForm({
  initialValues,
  tripDates,
  days,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialValues)
  const [error, setError] = useState('')

  function handleChange(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
      setError('')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!form.date) {
      setError('Date is required.')
      return
    }

    const success = onSubmit(form)
    if (!success) {
      setError('Could not save activity. Please try again.')
    }
  }

  const selectedDay = days.find((day) => day.date === form.date)

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="activity-title">Title *</label>
        <input
          id="activity-title"
          type="text"
          value={form.title}
          onChange={handleChange('title')}
          required
          autoComplete="off"
        />
      </div>

      <div className="form-field">
        <label htmlFor="activity-date">Date *</label>
        <select
          id="activity-date"
          value={form.date}
          onChange={handleChange('date')}
          required
        >
          {tripDates.map((date) => {
            const day = days.find((item) => item.date === date)
            return (
              <option key={date} value={date}>
                {day?.displayDate ?? date}
              </option>
            )
          })}
        </select>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="activity-time">Time</label>
          <input
            id="activity-time"
            type="text"
            placeholder="2:30 PM"
            value={form.time}
            onChange={handleChange('time')}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor="activity-time-label">Time label</label>
          <input
            id="activity-time-label"
            type="text"
            placeholder="Morning"
            value={form.timeLabel}
            onChange={handleChange('timeLabel')}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="activity-city">City</label>
          <input
            id="activity-city"
            type="text"
            value={form.city}
            onChange={handleChange('city')}
            placeholder={selectedDay?.city ?? 'Tokyo'}
            autoComplete="off"
          />
        </div>
        <div className="form-field">
          <label htmlFor="activity-type">Type</label>
          <select
            id="activity-type"
            value={form.type}
            onChange={handleChange('type')}
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="activity-location">Location</label>
        <input
          id="activity-location"
          type="text"
          value={form.location}
          onChange={handleChange('location')}
          autoComplete="off"
        />
      </div>

      <div className="form-field">
        <label htmlFor="activity-notes">Notes</label>
        <textarea
          id="activity-notes"
          rows={3}
          value={form.notes}
          onChange={handleChange('notes')}
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
