import { useState, useEffect } from 'react'
import { APP_TOUR_VERSION, TOUR_VERSION_KEY } from '../constants/appVersion'

const TOUR_STEPS = [
  {
    id: 'welcome',
    tab: 'today',
    title: 'Welcome to Japan 2026',
    content: 'Here\'s a quick look at everything the group can use during the trip.',
  },
  {
    id: 'today',
    tab: 'today',
    title: 'Today',
    content: 'See your schedule with fixed-time anchors at the top. Check off activities, add ratings and favorites, save memories, navigate with Apple Maps, and add photos from each activity.',
  },
  {
    id: 'photos',
    tab: 'photos',
    title: 'Photos',
    content: 'View the shared group photo gallery. Upload from your camera or photo library, add photos after activities, filter by trip day, and delete photos you uploaded.',
  },
  {
    id: 'trip',
    tab: 'trip',
    title: 'Trip',
    content: 'Convert USD ⇄ JPY with live rates. Quick links to Google Translate and other useful Japan tools. View lodging, Shinkansen details, and confirmed reservations.',
  },
  {
    id: 'wrapped',
    tab: 'wrapped',
    title: 'Wrapped',
    content: 'See trip completion stats, favorite activities, favorite day, ratings, photos, and shared memories. Wrapped becomes more complete as the group uses the app.',
  },
  {
    id: 'ready',
    tab: 'today',
    title: 'You\'re ready',
    content: 'Add your name so the group knows which photos, ratings, favorites, and memories are yours.',
    isSignIn: true,
  },
]

export default function AppTour({ onClose, onSwitchTab, onOpenSignIn }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = step.isSignIn

  // Switch tab when step changes
  useEffect(() => {
    if (step.tab && onSwitchTab) {
      setIsTransitioning(true)
      onSwitchTab(step.tab)
      
      // Brief delay to let tab render
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [step.tab, onSwitchTab, currentStep])

  function handleNext() {
    if (isLast) {
      // Don't complete yet - wait for sign-in choice
      return
    }
    
    const nextStep = currentStep + 1
    setCurrentStep(nextStep)
  }

  function handleBack() {
    if (!isFirst) {
      setCurrentStep(currentStep - 1)
    }
  }

  function handleSkip() {
    // Jump to final sign-in step
    const readyStepIndex = TOUR_STEPS.findIndex(s => s.isSignIn)
    if (readyStepIndex > -1) {
      setCurrentStep(readyStepIndex)
    }
  }

  function handleSignIn() {
    // Save version and open sign-in
    localStorage.setItem(TOUR_VERSION_KEY, APP_TOUR_VERSION)
    if (onOpenSignIn) {
      onOpenSignIn()
    }
    onClose()
  }

  function handleMaybeLater() {
    // Save version and close
    localStorage.setItem(TOUR_VERSION_KEY, APP_TOUR_VERSION)
    onClose()
  }

  if (isTransitioning) {
    return null // Brief pause while tab switches
  }

  return (
    <>
      {/* Backdrop to prevent interaction with app */}
      <div className="tour-backdrop-overlay" onClick={(e) => e.stopPropagation()} />
      
      {/* Tour overlay */}
      <div className="tour-overlay">
        <div className="tour-overlay-content">
          <div className="tour-overlay-header">
            <h2 className="tour-overlay-title">{step.title}</h2>
            {!isLast && (
              <button
                type="button"
                className="tour-overlay-close"
                onClick={handleSkip}
                aria-label="Skip tour"
              >
                ×
              </button>
            )}
          </div>

          <p className="tour-overlay-text">{step.content}</p>

          {!isLast && (
            <div className="tour-progress">
              {TOUR_STEPS.filter(s => !s.isSignIn).map((_, index) => (
                <div
                  key={index}
                  className={`tour-progress-dot${index === currentStep ? ' active' : ''}`}
                  aria-label={`Step ${index + 1} of ${TOUR_STEPS.length - 1}`}
                />
              ))}
            </div>
          )}

          <div className="tour-overlay-controls">
            {isLast ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleMaybeLater}
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSignIn}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={isFirst ? handleSkip : handleBack}
                >
                  {isFirst ? 'Skip' : 'Back'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  Next
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
