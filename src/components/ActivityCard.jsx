import { formatActivityTime } from '../utils/activitySorting'

function StarRating({ rating, onChange }) {
  return (
    <div className="star-rating" role="group" aria-label="Rate this activity">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className={`star-btn${rating >= value ? ' active' : ''}`}
          onClick={() => onChange(value === rating ? null : value)}
          aria-label={`${value} star${value > 1 ? 's' : ''}`}
          aria-pressed={rating >= value}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ActivityCard({
  activity,
  onToggleComplete,
  onSetRating,
  onSetMemory,
  onEdit,
  onDelete,
}) {
  const isComplete = activity.status === 'complete'
  const timeLabel = formatActivityTime(activity)
  const isUser = activity.source === 'user'

  return (
    <li className={`activity-card${isComplete ? ' done' : ''}`}>
      <div className="activity-main">
        <button
          type="button"
          className={`activity-checkbox${isComplete ? ' checked' : ''}`}
          onClick={() => onToggleComplete(activity.id)}
          aria-label={
            isComplete
              ? `Mark ${activity.title} incomplete`
              : `Mark ${activity.title} complete`
          }
          aria-pressed={isComplete}
        >
          <svg
            className="checkmark"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="activity-content">
          <div className="activity-header">
            {timeLabel && (
              <span className="activity-time">{timeLabel}</span>
            )}
            <span className="type-badge">{activity.type}</span>
          </div>
          <p className="activity-title">{activity.title}</p>
          {activity.location && (
            <p className="activity-location">{activity.location}</p>
          )}
          {activity.notes && (
            <p className="activity-notes">{activity.notes}</p>
          )}
        </div>

        {isUser && (
          <div className="activity-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit(activity)}
              aria-label={`Edit ${activity.title}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="icon-btn icon-btn-danger"
              onClick={() => onDelete(activity)}
              aria-label={`Delete ${activity.title}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isComplete && (
        <div className="activity-memory">
          <StarRating
            rating={activity.rating}
            onChange={(rating) => onSetRating(activity.id, rating)}
          />
          <label className="memory-label" htmlFor={`memory-${activity.id}`}>
            Memory
          </label>
          <textarea
            id={`memory-${activity.id}`}
            className="memory-input"
            rows={2}
            placeholder="One sentence about this moment..."
            value={activity.memory}
            onChange={(event) =>
              onSetMemory(activity.id, event.target.value)
            }
          />
          <button type="button" className="photo-placeholder" disabled>
            Add photo (coming soon)
          </button>
        </div>
      )}
    </li>
  )
}
