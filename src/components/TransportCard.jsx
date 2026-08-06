export default function TransportCard({ transport }) {
  const { type, date, time, endTime, timeLabel, title, details, location } = transport

  if (type === 'flight') {
    return (
      <div className="transport-card">
        <div className="transport-header">
          <span className="transport-icon">✈️</span>
          <div className="transport-title-group">
            <p className="transport-title">{title}</p>
            {timeLabel && <p className="transport-time">{timeLabel}</p>}
          </div>
        </div>
        {location && <p className="transport-location">{location}</p>}
      </div>
    )
  }

  // Shinkansen
  if (details) {
    return (
      <div className="transport-card">
        <div className="transport-header">
          <span className="transport-icon">🚄</span>
          <div className="transport-title-group">
            <p className="transport-title">
              {details.origin} → {details.destination}
            </p>
            <p className="transport-time">{timeLabel}</p>
          </div>
        </div>
        
        <div className="transport-details">
          <div className="transport-detail-row">
            <span className="detail-label">Train:</span>
            <span className="detail-value">{details.train}</span>
          </div>
          <div className="transport-detail-row">
            <span className="detail-label">Car:</span>
            <span className="detail-value">{details.car}</span>
          </div>
          {details.seats && details.seats.length > 0 && (
            <div className="transport-detail-row">
              <span className="detail-label">Seats:</span>
              <span className="detail-value">{details.seats.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Generic transport
  return (
    <div className="transport-card">
      <div className="transport-header">
        <span className="transport-icon">🚊</span>
        <div className="transport-title-group">
          <p className="transport-title">{title}</p>
          {timeLabel && <p className="transport-time">{timeLabel}</p>}
        </div>
      </div>
      {location && <p className="transport-location">{location}</p>}
    </div>
  )
}
