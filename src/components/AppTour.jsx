import { useState } from 'react'
import { APP_TOUR_VERSION, TOUR_VERSION_KEY } from '../constants/appVersion'

const TOUR_STEPS = [
  {
    id: 'welcome',
    tab: null,
    title: 'Welcome to Japan 2026',
    content: [
      'Your shared trip companion for the group.',
      'Everything in one place: itinerary, photos, trip tools, and a recap at the end.',
      'Changes sync instantly across all travelers.',
    ],
  },
  {
    id: 'today',
    tab: 'today',
    title: 'Today',
    content: [
      'See your daily itinerary with fixed-time anchors at the top.',
      'Mark activities complete, add ratings and favorites, and save memories.',
      'Navigate with Apple Maps and add photos directly from each activity.',
    ],
  },
  {
    id: 'photos',
    tab: 'photos',
    title: 'Photos',
    content: [
      'Upload photos from your camera or photo library.',
      'Everyone\'s photos appear in the shared gallery.',
      'Filter by trip day and add photos anytime during or after the trip.',
    ],
  },
  {
    id: 'trip',
    tab: 'trip',
    title: 'Trip',
    content: [
      'Convert USD ⇄ JPY with live exchange rates.',
      'Quick links to useful Japan tools: taxis, restaurants, transit, and more.',
      'View lodging, transportation, and confirmed reservations.',
    ],
  },
  {
    id: 'wrapped',
    tab: 'wrapped',
    title: 'Wrapped',
    content: [
      'See trip stats, favorite activities, and top-rated moments.',
      'Compare photos, ratings, and memories from all travelers.',
      'Wrapped gets better as the group uses the app throughout the trip.',
    ],
  },
  {
    id: 'finish',
    tab: null,
    title: "You're ready",
    content: [
      'Changes sync across all travelers automatically.',
      'Use the app throughout your trip to track activities, share photos, and save memories.',
      'Enjoy Japan! 🇯🇵',
    ],
  },
]

export default function AppTour({ onClose, onSwitchTab }) {
  const [currentStep, setCurrentStep] = useState(0)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  function handleNext() {
    if (isLast) {
      handleComplete()
    } else {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      
      // Switch tab if needed
      const nextStepData = TOUR_STEPS[nextStep]
      if (nextStepData.tab && onSwitchTab) {
        onSwitchTab(nextStepData.tab)
      }
    }
  }

  function handleBack() {
    if (!isFirst) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      
      // Switch tab if needed
      const prevStepData = TOUR_STEPS[prevStep]
      if (prevStepData.tab && onSwitchTab) {
        onSwitchTab(prevStepData.tab)
      }
    }
  }

  function handleSkip() {
    handleComplete()
  }

  function handleComplete() {
    // Save completed version
    localStorage.setItem(TOUR_VERSION_KEY, APP_TOUR_VERSION)
    onClose()
  }

  // Switch tab when step changes
  if (step.tab && onSwitchTab) {
    // This runs on first render of each step
    setTimeout(() => onSwitchTab(step.tab), 0)
  }

  return (
    <div className="tour-backdrop" onClick={(e) => e.target === e.currentTarget && handleSkip()}>
      <div className="tour-modal">
        <div className="tour-header">
          <h2 className="tour-title">{step.title}</h2>
          <button
            type="button"
            className="tour-close"
            onClick={handleSkip}
            aria-label="Skip tour"
          >
            ×
          </button>
        </div>

        <div className="tour-content">
          {step.content.map((paragraph, index) => (
            <p key={index} className="tour-paragraph">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="tour-progress">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`tour-progress-dot${index === currentStep ? ' active' : ''}`}
              aria-label={`Step ${index + 1} of ${TOUR_STEPS.length}`}
            />
          ))}
        </div>

        <div className="tour-controls">
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
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
