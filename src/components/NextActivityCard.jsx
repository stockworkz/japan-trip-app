import { formatActivityTime } from '../utils/activitySorting'
import { getAppleMapsUrl, canNavigate } from '../utils/appleMaps'

export default function NextActivityCard({ 
  activity, 
  sharedLocation,
  onAddActivity, 
  onAddLocation,
  isEmpty,
  isTourActive = false
}) {
  if (isEmpty) {
    return (
      <section className="next-card" aria-label="Next up">
        <p className="next-label">Next Up</p>
        <p className="next-activity">No activities planned yet.</p>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={onAddActivity}
          disabled={isTourActive}
        >
          Add Activity
        </button>
      </section>
    )
  }

  if (!activity) {
    return (
      <section className="next-card next-card-complete" aria-label="Next up">
        <p className="next-label">Next Up</p>
        <p className="next-activity">All done for today! 🎉</p>
        <p className="next-subtext">
          Enjoy your evening or add something new to the plan.
        </p>
      </section>
    )
  }

  const timeLabel = formatActivityTime(activity)
  const mapsUrl = getAppleMapsUrl(activity, sharedLocation)
  const hasDestination = canNavigate(activity, sharedLocation)

  return (
    <section className="next-card" aria-label="Next up">
      <p className="next-label">Next Up</p>
      <p className="next-activity">{activity.title}</p>
      <div className="next-meta">
        {timeLabel && <span>{timeLabel}</span>}
        <span className="type-badge">{activity.type}</span>
        {activity.location && <span>{activity.location}</span>}
      </div>
      <div className="button-row">
        {hasDestination ? (
          <>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open in Apple Maps
            </a>
            {sharedLocation && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => !isTourActive && onAddLocation(activity)}
                title="Edit address"
                disabled={isTourActive}
              >
                Edit
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => !isTourActive && onAddLocation(activity)}
            disabled={isTourActive}
          >
            Add Address
          </button>
        )}
      </div>
    </section>
  )
}
