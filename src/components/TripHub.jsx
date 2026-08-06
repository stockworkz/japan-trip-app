import rawData from '../data/japan-itinerary-2026.json'
import CurrencyConverter from './CurrencyConverter'
import TransportCard from './TransportCard'
import { formatActivityTime } from '../utils/activitySorting'
import { getAppleMapsUrl, canNavigate } from '../utils/appleMaps'

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  if (start.getMonth() === end.getMonth()) {
    return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
  }
  
  return `${monthNames[start.getMonth()]} ${start.getDate()}–${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
}

function formatLodgingDates(checkIn, checkOut) {
  const start = new Date(checkIn + 'T00:00:00')
  const end = new Date(checkOut + 'T00:00:00')
  const monthNames = ['August', 'September', 'October']
  
  if (start.getMonth() === end.getMonth()) {
    return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
  }
  
  return `${monthNames[start.getMonth()]} ${start.getDate()}–${monthNames[end.getMonth()]} ${end.getDate()}`
}

function getLodgingDisplayName(lodging) {
  if (lodging.name) return lodging.name
  return `${lodging.city} ${lodging.type}`
}

export default function TripHub({
  allActivities = [],
  completionState = {},
  getLocation,
  onAddLocation,
}) {
  const { trip, lodging } = rawData

  // Calculate completion progress
  const totalActivities = allActivities.length
  const completedCount = allActivities.filter(a => completionState[a.id]).length
  const completionPercentage = totalActivities > 0
    ? Math.round((completedCount / totalActivities) * 100)
    : 0

  // Extract transportation
  const transportActivities = allActivities.filter(
    a => a.type === 'transport' && a.reservation === true
  )
  
  // Find specific transports
  const tokyoToKyotoTrain = transportActivities.find(a => a.id === '2026-08-10-shinkansen')
  const kyotoToTokyoTrain = transportActivities.find(a => a.id === '2026-08-12-shinkansen')
  const departure = allActivities.find(a => a.id === '2026-08-15-depart')

  // Extract confirmed reservations (non-travel activities with reservation flag)
  // All travel/transport activities shown in Major Transportation section only
  const reservations = allActivities
    .filter(a => {
      // Must have reservation flag
      if (a.reservation !== true) return false
      
      // Exclude all travel/transport activities (shown in Major Transportation)
      if (a.type === 'transport') return false
      
      return true
    })
    .sort((a, b) => {
      // Sort by date, then by time
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      
      const aTime = a.time || '99:99'
      const bTime = b.time || '99:99'
      return aTime.localeCompare(bTime)
    })

  return (
    <main className="trip-hub">
      {/* 1. Trip Overview */}
      <section className="trip-overview">
        <h1 className="trip-title">{trip.name}</h1>
        <p className="trip-dates">{formatDateRange(trip.startDate, trip.endDate)}</p>
        
        <div className="trip-stats">
          <div className="trip-stat">
            <span className="stat-value">{trip.endDate.split('-').pop() - trip.startDate.split('-').pop() + 1}</span>
            <span className="stat-label">days</span>
          </div>
          <div className="trip-stat">
            <span className="stat-value">{trip.travelers}</span>
            <span className="stat-label">travelers</span>
          </div>
          <div className="trip-stat">
            <span className="stat-value">{trip.cities.length}</span>
            <span className="stat-label">cities</span>
          </div>
        </div>

        <p className="trip-route">
          <span className="route-label">Route:</span> Tokyo → Kyoto → Tokyo
        </p>

        <div className="trip-completion">
          <div className="completion-bar-container">
            <div 
              className="completion-bar-fill" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="completion-text">
            {completedCount} of {totalActivities} activities completed ({completionPercentage}%)
          </p>
        </div>
      </section>

      {/* 2. Currency Converter */}
      <CurrencyConverter />

      {/* 3. Useful in Japan */}
      <section className="trip-section">
        <h2 className="section-title">Useful in Japan</h2>
        <div className="useful-links">
          <a
            href="https://translate.google.com/?sl=auto&tl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className="useful-link-card"
          >
            <span className="useful-icon">🌐</span>
            <div className="useful-content">
              <p className="useful-title">Google Translate</p>
              <p className="useful-description">Translate text or conversation</p>
            </div>
          </a>

          <a
            href="https://go.goinc.jp/en"
            target="_blank"
            rel="noopener noreferrer"
            className="useful-link-card"
          >
            <span className="useful-icon">🚕</span>
            <div className="useful-content">
              <p className="useful-title">GO Taxi</p>
              <p className="useful-description">Call a taxi</p>
            </div>
          </a>

          <a
            href="https://s.tabelog.com/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="useful-link-card"
          >
            <span className="useful-icon">🍜</span>
            <div className="useful-content">
              <p className="useful-title">Tabelog</p>
              <p className="useful-description">Find restaurants</p>
            </div>
          </a>

          <a
            href="https://japantravel.navitime.com/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="useful-link-card"
          >
            <span className="useful-icon">🚇</span>
            <div className="useful-content">
              <p className="useful-title">Japan Travel by NAVITIME</p>
              <p className="useful-description">Plan trains and transit</p>
            </div>
          </a>

          <a
            href="https://www.jreast.co.jp/en/multi/pass/suica.html"
            target="_blank"
            rel="noopener noreferrer"
            className="useful-link-card"
          >
            <span className="useful-icon">💳</span>
            <div className="useful-content">
              <p className="useful-title">Suica Information</p>
              <p className="useful-description">Transit card help</p>
            </div>
          </a>
        </div>
      </section>

      {/* 4. Lodging */}
      <section className="trip-section">
        <h2 className="section-title">Lodging</h2>
        <div className="lodging-list">
          {lodging.map((stay, index) => {
            const displayName = getLodgingDisplayName(stay)
            
            // Try to find related activity for address lookup
            let relatedActivity = null
            if (stay.name) {
              relatedActivity = allActivities.find(
                a => a.type === 'accommodation' && a.title && a.title.includes(stay.name)
              )
            }
            
            const sharedLocation = relatedActivity ? getLocation(relatedActivity.id) : null
            const mapsUrl = relatedActivity ? getAppleMapsUrl(relatedActivity, sharedLocation) : null
            const hasDestination = relatedActivity ? canNavigate(relatedActivity, sharedLocation) : false

            return (
              <div key={index} className="lodging-card">
                <div className="lodging-header">
                  <h3 className="lodging-name">{displayName}</h3>
                  <p className="lodging-dates">{formatLodgingDates(stay.checkIn, stay.checkOut)}</p>
                </div>
                
                <div className="lodging-details">
                  <p className="lodging-city">{stay.city}</p>
                  {stay.checkInTime && (
                    <p className="lodging-checkin">Check-in: {stay.checkInTime}</p>
                  )}
                </div>

                <div className="lodging-actions">
                  {stay.url && (
                    <a
                      href={stay.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link lodging-link"
                    >
                      View booking
                    </a>
                  )}
                  
                  {stay.type === 'Hotel' && relatedActivity && (
                    <>
                      {hasDestination && mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-link"
                        >
                          Open in Apple Maps
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => onAddLocation(relatedActivity)}
                        >
                          Add address
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. Major Transportation */}
      <section className="trip-section">
        <h2 className="section-title">Major Transportation</h2>
        <div className="transport-list">
          {tokyoToKyotoTrain && (
            <TransportCard 
              transport={{
                ...tokyoToKyotoTrain,
                type: 'shinkansen'
              }} 
            />
          )}
          {kyotoToTokyoTrain && (
            <TransportCard 
              transport={{
                ...kyotoToTokyoTrain,
                type: 'shinkansen'
              }} 
            />
          )}
          {departure && (
            <TransportCard 
              transport={{
                ...departure,
                type: 'flight'
              }} 
            />
          )}
        </div>
      </section>

      {/* 6. Confirmed Reservations */}
      <section className="trip-section">
        <h2 className="section-title">Confirmed Reservations</h2>
        {reservations.length > 0 ? (
          <ul className="reservation-list">
            {reservations.map((activity) => {
              const timeLabel = formatActivityTime(activity)
              const sharedLocation = getLocation(activity.id)
              const mapsUrl = getAppleMapsUrl(activity, sharedLocation)
              const hasDestination = canNavigate(activity, sharedLocation)
              
              return (
                <li key={activity.id} className="reservation-item">
                  <div className="reservation-main">
                    <div className="reservation-header">
                      {timeLabel && (
                        <span className="reservation-time">{timeLabel}</span>
                      )}
                      <span className="reservation-badge">Reserved</span>
                    </div>
                    <p className="reservation-title">{activity.title}</p>
                    {activity.location && (
                      <p className="reservation-location">{activity.location}</p>
                    )}
                  </div>
                  
                  {hasDestination && mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="reservation-nav-link"
                    >
                      📍
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="empty-text">No confirmed reservations</p>
        )}
      </section>

      {/* Bottom padding to prevent nav overlap */}
      <div className="trip-bottom-spacer" />
    </main>
  )
}
