import { formatActivityTime } from '../utils/activitySorting'

export default function AnchorsCard({ anchors }) {
  if (!anchors || anchors.length === 0) return null

  return (
    <section className="anchors-card" aria-label="Today's anchors">
      <h2 className="anchors-title">Today&apos;s anchors</h2>
      <p className="anchors-subtitle">Fixed times and reservations</p>
      <ul className="anchors-list">
        {anchors.map((activity) => {
          const timeLabel = formatActivityTime(activity)
          const isComplete = activity.status === 'complete'

          return (
            <li key={activity.id} className={`anchor-item${isComplete ? ' done' : ''}`}>
              <div className="anchor-time">{timeLabel || '—'}</div>
              <div className="anchor-content">
                <p className="anchor-title">{activity.title}</p>
                {activity.location && (
                  <p className="anchor-location">{activity.location}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
