import { useState } from 'react'
import WrappedCard from './WrappedCard'

export default function Wrapped({ wrappedData }) {
  const [currentCard, setCurrentCard] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const {
    tripDates,
    uniqueCities,
    totalActivities,
    completedActivities,
    completionPercentage,
    totalPhotos,
    travelerNames,
    favoriteDay,
    favoriteDayPhotos,
    topRatedActivity,
    mostPhotographedMoment,
    groupFavorites,
    topPhotographer,
    mostGenerousRater,
    toughestCritic,
    memoryKeeper,
    curatedMemories,
    heroPhotos,
    collagePhotos,
  } = wrappedData

  // Build card list dynamically based on available data
  const cards = []

  // 1. Opening card (always show)
  cards.push('opening')

  // 2. Trip at a glance (always show)
  cards.push('glance')

  // 3. Completion (always show)
  cards.push('completion')

  // 4. Favorite day (show if we have a favorite day)
  if (favoriteDay) {
    cards.push('favoriteDay')
  }

  // 5. Top-rated activity (show if we have ratings)
  if (topRatedActivity) {
    cards.push('topRated')
  }

  // 6. Most photographed moment (show if we have photos)
  if (mostPhotographedMoment) {
    cards.push('mostPhotographed')
  }

  // 7. Group favorites (show if we have favorites)
  if (groupFavorites.length > 0) {
    cards.push('groupFavorites')
  }

  // 8. Superlatives (show if we have any)
  const hasSuperlatives =
    topPhotographer || mostGenerousRater || toughestCritic || memoryKeeper
  if (hasSuperlatives) {
    cards.push('superlatives')
  }

  // 9. Trip memories (show if we have memories)
  if (curatedMemories.length > 0) {
    cards.push('memories')
  }

  // 10. Final collage (show if we have photos)
  if (collagePhotos.length > 0) {
    cards.push('collage')
  } else {
    // Show closing card even without photos
    cards.push('closing')
  }

  const totalCards = cards.length

  const minSwipeDistance = 50

  function handleTouchStart(e) {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  function handleTouchMove(e) {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  function handleTouchEnd() {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  function goToNext() {
    setCurrentCard((prev) => Math.min(prev + 1, totalCards - 1))
  }

  function goToPrevious() {
    setCurrentCard((prev) => Math.max(prev - 1, 0))
  }

  function renderCard(cardType) {
    switch (cardType) {
      case 'opening':
        return renderOpeningCard()
      case 'glance':
        return renderGlanceCard()
      case 'completion':
        return renderCompletionCard()
      case 'favoriteDay':
        return renderFavoriteDayCard()
      case 'topRated':
        return renderTopRatedCard()
      case 'mostPhotographed':
        return renderMostPhotographedCard()
      case 'groupFavorites':
        return renderGroupFavoritesCard()
      case 'superlatives':
        return renderSuperlativesCard()
      case 'memories':
        return renderMemoriesCard()
      case 'collage':
        return renderCollageCard()
      case 'closing':
        return renderClosingCard()
      default:
        return null
    }
  }

  function renderOpeningCard() {
    const startDate = tripDates.length > 0 ? tripDates[0] : ''
    const endDate = tripDates.length > 0 ? tripDates[tripDates.length - 1] : ''

    return (
      <WrappedCard className="opening-card">
        {heroPhotos.length > 0 && (
          <div className={`hero-collage hero-collage-${heroPhotos.length}`}>
            {heroPhotos.map((photo, i) => (
              <img
                key={photo.id}
                src={photo.url}
                alt=""
                className="hero-photo"
              />
            ))}
          </div>
        )}
        <div className="opening-content">
          <h1 className="wrapped-title">Japan 2026</h1>
          <p className="wrapped-subtitle">
            {startDate} – {endDate}
          </p>
          {travelerNames.length > 0 && (
            <p className="wrapped-travelers">{travelerNames.join(', ')}</p>
          )}
        </div>
      </WrappedCard>
    )
  }

  function renderGlanceCard() {
    return (
      <WrappedCard className="glance-card">
        <h2 className="card-title">Your trip at a glance</h2>
        <div className="glance-stats">
          <div className="glance-stat">
            <div className="stat-value">{tripDates.length}</div>
            <div className="stat-label">Days</div>
          </div>
          <div className="glance-stat">
            <div className="stat-value">{uniqueCities}</div>
            <div className="stat-label">Cities</div>
          </div>
          <div className="glance-stat">
            <div className="stat-value">{completedActivities}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="glance-stat">
            <div className="stat-value">{totalActivities}</div>
            <div className="stat-label">Planned</div>
          </div>
          <div className="glance-stat">
            <div className="stat-value">{totalPhotos}</div>
            <div className="stat-label">Photos</div>
          </div>
        </div>
      </WrappedCard>
    )
  }

  function renderCompletionCard() {
    // Simple CSS-based progress ring
    const circumference = 2 * Math.PI * 80 // radius = 80
    const offset = circumference - (completionPercentage / 100) * circumference

    return (
      <WrappedCard className="completion-card">
        <h2 className="card-title">Trip completion</h2>
        <div className="completion-ring-container">
          <svg className="completion-ring" width="200" height="200">
            <circle
              className="completion-ring-bg"
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            <circle
              className="completion-ring-progress"
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#e84c5c"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div className="completion-percentage">
            <span className="percentage-value">{completionPercentage}%</span>
            <span className="percentage-label">
              {completedActivities} of {totalActivities}
            </span>
          </div>
        </div>
      </WrappedCard>
    )
  }

  function renderFavoriteDayCard() {
    if (!favoriteDay) return null

    return (
      <WrappedCard className="favorite-day-card">
        <h2 className="card-title">Favorite day</h2>
        <div className="favorite-day-content">
          <h3 className="day-title">{favoriteDay.day.displayDate}</h3>
          <p className="day-city">{favoriteDay.day.city}</p>
          <div className="day-stats">
            <span>{favoriteDay.photos} photos</span>
            <span>{favoriteDay.completed} completed</span>
            {favoriteDay.avgRating > 0 && (
              <span>{favoriteDay.avgRating.toFixed(1)} ★ avg</span>
            )}
            {favoriteDay.favorites > 0 && (
              <span>{favoriteDay.favorites} ❤</span>
            )}
          </div>
          {favoriteDayPhotos.length > 0 && (
            <div className={`day-photos day-photos-${favoriteDayPhotos.length}`}>
              {favoriteDayPhotos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  className="day-photo"
                />
              ))}
            </div>
          )}
        </div>
      </WrappedCard>
    )
  }

  function renderTopRatedCard() {
    if (!topRatedActivity) return null

    return (
      <WrappedCard className="top-rated-card">
        <h2 className="card-title">Top-rated moment</h2>
        <div className="top-rated-content">
          {topRatedActivity.photo && (
            <img
              src={topRatedActivity.photo.url}
              alt=""
              className="top-rated-photo"
            />
          )}
          <h3 className="activity-title">{topRatedActivity.activity.title}</h3>
          <div className="activity-rating">
            <span className="rating-stars">
              {'★'.repeat(Math.round(topRatedActivity.avgRating))}
            </span>
            <span className="rating-value">
              {topRatedActivity.avgRating.toFixed(1)} ({topRatedActivity.ratingCount})
            </span>
          </div>
          {topRatedActivity.favoriteCount > 0 && (
            <p className="favorite-count">
              {topRatedActivity.favoriteCount} ❤ favorites
            </p>
          )}
        </div>
      </WrappedCard>
    )
  }

  function renderMostPhotographedCard() {
    if (!mostPhotographedMoment) return null

    return (
      <WrappedCard className="most-photographed-card">
        <h2 className="card-title">Most photographed</h2>
        <div className="most-photographed-content">
          <h3 className="moment-title">
            {mostPhotographedMoment.type === 'activity'
              ? mostPhotographedMoment.activity.title
              : mostPhotographedMoment.day.displayDate}
          </h3>
          <p className="moment-count">{mostPhotographedMoment.count} photos</p>
          {mostPhotographedMoment.photos.length > 0 && (
            <div
              className={`moment-photos moment-photos-${mostPhotographedMoment.photos.length}`}
            >
              {mostPhotographedMoment.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt=""
                  className="moment-photo"
                />
              ))}
            </div>
          )}
        </div>
      </WrappedCard>
    )
  }

  function renderGroupFavoritesCard() {
    if (groupFavorites.length === 0) return null

    return (
      <WrappedCard className="group-favorites-card">
        <h2 className="card-title">Group favorites</h2>
        <div className="favorites-list">
          {groupFavorites.map((fav, index) => (
            <div key={fav.activity.id} className="favorite-item">
              <div className="favorite-rank">{index + 1}</div>
              <div className="favorite-details">
                <h3 className="favorite-title">{fav.activity.title}</h3>
                <p className="favorite-meta">
                  {fav.day?.displayDate}
                  {fav.ratingCount > 0 && (
                    <span> • {fav.avgRating.toFixed(1)} ★</span>
                  )}
                  <span> • {fav.favoriteCount} ❤</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </WrappedCard>
    )
  }

  function renderSuperlativesCard() {
    const superlatives = []

    if (topPhotographer) {
      superlatives.push({
        title: 'Most Prolific Photographer',
        name: topPhotographer.name,
        detail: `${topPhotographer.photoCount} photos`,
      })
    }

    if (mostGenerousRater) {
      superlatives.push({
        title: 'Most Generous Rater',
        name: mostGenerousRater.name,
        detail: `${mostGenerousRater.ratingCount} ratings`,
      })
    }

    if (toughestCritic) {
      superlatives.push({
        title: 'Toughest Critic',
        name: toughestCritic.name,
        detail: `${toughestCritic.avgRating.toFixed(1)} ★ average`,
      })
    }

    if (memoryKeeper) {
      superlatives.push({
        title: 'Memory Keeper',
        name: memoryKeeper.name,
        detail: `${memoryKeeper.memoryCount} memories`,
      })
    }

    if (superlatives.length === 0) return null

    return (
      <WrappedCard className="superlatives-card">
        <h2 className="card-title">Traveler superlatives</h2>
        <div className="superlatives-list">
          {superlatives.map((sup, index) => (
            <div key={index} className="superlative-item">
              <h3 className="superlative-title">{sup.title}</h3>
              <p className="superlative-name">{sup.name}</p>
              <p className="superlative-detail">{sup.detail}</p>
            </div>
          ))}
        </div>
      </WrappedCard>
    )
  }

  function renderMemoriesCard() {
    if (curatedMemories.length === 0) return null

    return (
      <WrappedCard className="memories-card">
        <h2 className="card-title">Trip memories</h2>
        <div className="memories-list">
          {curatedMemories.map((mem, index) => (
            <div key={index} className="memory-item">
              <p className="memory-text">"{mem.memory}"</p>
              <p className="memory-meta">
                — {mem.travelerName}, {mem.activityTitle}
              </p>
            </div>
          ))}
        </div>
      </WrappedCard>
    )
  }

  function renderCollageCard() {
    if (collagePhotos.length === 0) return null

    return (
      <WrappedCard className="collage-card">
        <div className={`photo-collage photo-collage-${collagePhotos.length}`}>
          {collagePhotos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="collage-photo"
            />
          ))}
        </div>
        <p className="collage-closing">See you next trip ✨</p>
      </WrappedCard>
    )
  }

  function renderClosingCard() {
    return (
      <WrappedCard className="closing-card">
        <h2 className="card-title">See you next trip</h2>
        <p className="closing-message">✨</p>
      </WrappedCard>
    )
  }

  return (
    <div
      className="wrapped-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="wrapped-viewport">
        <div
          className="wrapped-cards"
          style={{
            transform: `translateX(-${currentCard * 100}%)`,
          }}
        >
          {cards.map((cardType, index) => (
            <div key={index} className="wrapped-card-wrapper">
              {renderCard(cardType)}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="wrapped-nav">
        <button
          type="button"
          className="wrapped-nav-btn"
          onClick={goToPrevious}
          disabled={currentCard === 0}
          aria-label="Previous card"
        >
          ←
        </button>
        <div className="wrapped-progress">
          {cards.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`progress-dot${index === currentCard ? ' active' : ''}`}
              onClick={() => setCurrentCard(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="wrapped-nav-btn"
          onClick={goToNext}
          disabled={currentCard === totalCards - 1}
          aria-label="Next card"
        >
          →
        </button>
      </div>
    </div>
  )
}
