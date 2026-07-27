export default function TripHeader({ selectedDay, tripProgress }) {
  const { completed, total } = tripProgress
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <header className="header">
      <h1 className="title">Japan 2026</h1>
      <p className="subtitle">
        {selectedDay.city} • {selectedDay.displayDate}
      </p>
      <div className="trip-progress" aria-label="Overall trip progress">
        <div className="trip-progress-labels">
          <span>Trip progress</span>
          <span>
            {completed} of {total} completed
          </span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </header>
  )
}
