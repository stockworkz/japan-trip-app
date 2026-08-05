import { formatActivityTime } from '../utils/activitySorting'

function StarRating({ rating, averageRating, ratingCount, onChange }) {
  return (
    <div className="star-rating-container">
      <div className="star-rating" role="group" aria-label="Rate this activity">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`star-btn${rating >= value ? ' active' : ''}`}
            onClick={() => onChange(value)}
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            aria-pressed={rating >= value}
          >
            ★
          </button>
        ))}
      </div>
      {averageRating && ratingCount > 0 && (
        <span className="rating-aggregate">
          {averageRating.toFixed(1)} ({ratingCount})
        </span>
      )}
    </div>
  )
}

export default function ActivityCard({
  activity,
  onToggleComplete,
  onSetRating,
  onToggleFavorite,
  onSetMemory,
  onEdit,
  onDelete,
  user,
  userFeedback,
  allMemories,
  averageRating,
  favoriteCount,
}) {
  const isComplete = activity.status === 'complete'
  const timeLabel = formatActivityTime(activity)
  const isUser = activity.source === 'user'
  const isFavorite = userFeedback?.is_favorite || false
  const userRating = userFeedback?.rating || null
  const userMemory = userFeedback?.memory || ''

  // Get other users' memories (not including current user)
  const otherMemories = allMemories.filter((m) => m.userId !== user?.id)

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
            {activity.optional && (
              <span className="optional-badge">optional</span>
            )}
            {activity.needsConfirmation && (
              <span className="needs-confirmation-badge">needs confirmation</span>
            )}
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
          <div className="memory-actions">
            <StarRating
              rating={userRating}
              averageRating={averageRating?.average}
              ratingCount={averageRating?.count}
              onChange={(rating) => onSetRating(activity.id, rating)}
            />
            <button
              type="button"
              className={`favorite-btn${isFavorite ? ' active' : ''}`}
              onClick={() => onToggleFavorite(activity.id)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={isFavorite}
            >
              {isFavorite ? '❤' : '♡'}
              {favoriteCount > 0 && (
                <span className="favorite-count">{favoriteCount}</span>
              )}
            </button>
          </div>
          <label className="memory-label" htmlFor={`memory-${activity.id}`}>
            Your memory
          </label>
          <textarea
            id={`memory-${activity.id}`}
            className="memory-input"
            rows={2}
            placeholder="One sentence about this moment..."
            value={userMemory}
            onChange={(e) => onSetMemory(activity.id, e.target.value)}
          />

          {otherMemories.length > 0 && (
            <div className="shared-memories">
              <p className="shared-memories-label">Shared memories</p>
              {otherMemories.map((memory, index) => (
                <div key={`${memory.userId}-${index}`} className="shared-memory">
                  <p className="shared-memory-text">{memory.memory}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}
