import { formatActivityTime } from '../utils/activitySorting'

export default function NextActivityCard({ activity, onAddActivity, isEmpty }) {
  if (isEmpty) {
    return (
      <section className="next-card" aria-label="Next up">
        <p className="next-label">Next Up</p>
        <p className="next-activity">No activities planned yet.</p>
        <button type="button" className="btn btn-primary" onClick={onAddActivity}>
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
        <button type="button" className="btn btn-primary">
          Navigate
        </button>
        <button type="button" className="btn btn-secondary">
          Details
        </button>
      </div>
    </section>
  )
}
