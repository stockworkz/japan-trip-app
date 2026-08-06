import { useState } from 'react'
import ActivityCard from './components/ActivityCard'
import ActivityForm from './components/ActivityForm'
import AddLocationModal from './components/AddLocationModal'
import AnchorsCard from './components/AnchorsCard'
import BottomNav from './components/BottomNav'
import DaySelector from './components/DaySelector'
import LodgingCard from './components/LodgingCard'
import Modal from './components/Modal'
import NextActivityCard from './components/NextActivityCard'
import PhotoGallery from './components/PhotoGallery'
import PhotoUpload from './components/PhotoUpload'
import ReflectionCard from './components/ReflectionCard'
import TravelerName from './components/TravelerName'
import TripHeader from './components/TripHeader'
import TripHub from './components/TripHub'
import Wrapped from './components/Wrapped'
import { useAuth } from './hooks/useAuth'
import { useActivityCompletion } from './hooks/useActivityCompletion'
import { useActivityFeedback } from './hooks/useActivityFeedback'
import { useActivityLocations } from './hooks/useActivityLocations'
import { usePhotoGallery } from './hooks/usePhotoGallery'
import { useTripState } from './hooks/useTripState'
import { useWrappedData } from './hooks/useWrappedData'
import { getFixedActivities } from './utils/activitySorting'
import './App.css'

function activityToForm(activity) {
  return {
    title: activity.title,
    date: activity.date,
    time: activity.time || '',
    timeLabel: activity.timeLabel || '',
    city: activity.city || '',
    type: activity.type || 'activity',
    location: activity.location || '',
    notes: activity.notes || '',
  }
}

function App() {
  const { user, loading: authLoading, error: authError, updateDisplayName } = useAuth()
  const {
    completionState,
    loading: completionLoading,
    error: completionError,
    toggleCompletion,
  } = useActivityCompletion(user)

  const {
    loading: feedbackLoading,
    error: feedbackError,
    allFeedback,
    getUserFeedback,
    getAllMemories,
    getAverageRating,
    getFavoriteCount,
    setRating,
    toggleFavorite,
    setMemory,
  } = useActivityFeedback(user)
  
  const {
    days,
    allActivities,
    tripDates,
    selectedDay,
    dayIndex,
    nextActivity,
    tripProgress,
    dayProgress,
    reflections,
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    setActivityRating,
    setActivityMemory,
    addActivity,
    editActivity,
    deleteActivity,
    setReflection,
    createEmptyForm,
  } = useTripState(completionState)

  const {
    photos,
    loading: photosLoading,
    error: photosError,
    deletePhoto,
  } = usePhotoGallery(user)

  const {
    locations,
    loading: locationsLoading,
    error: locationsError,
    getLocation,
    saveLocation,
  } = useActivityLocations(user)

  const wrappedData = useWrappedData({
    days,
    allActivities,
    completionState,
    photos,
    allFeedback,
    user,
  })

  const [activeTab, setActiveTab] = useState('today')
  const [formMode, setFormMode] = useState(null)
  const [editingActivity, setEditingActivity] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [preselectedPhoto, setPreselectedPhoto] = useState(null)
  const [photoUploadContext, setPhotoUploadContext] = useState(null)
  const [locationActivity, setLocationActivity] = useState(null)

  const isEmptyDay = selectedDay.activities.length === 0
  const fixedActivities = getFixedActivities(selectedDay.activities)

  async function handleToggleComplete(activityId) {
    const activity = selectedDay.activities.find((a) => a.id === activityId)
    if (!activity) return

    const currentStatus = activity.status === 'complete'
    const result = await toggleCompletion(activityId, currentStatus)

    if (result.error) {
      // Error is already logged and reverted in the hook
      alert(`Failed to update activity: ${result.error}`)
    }
  }

  function openLocationModal(activity) {
    setLocationActivity(activity)
  }

  function closeLocationModal() {
    setLocationActivity(null)
  }

  // Show loading state while auth and essential data initializes
  if (authLoading || completionLoading || feedbackLoading) {
    return (
      <div className="app">
        <div className="auth-loading">
          <div className="loading-spinner" />
          <p>Initializing...</p>
        </div>
      </div>
    )
  }

  // Photos can load in background, don't block app render

  // Show error state if auth or completion loading failed
  if (authError || completionError || feedbackError) {
    return (
      <div className="app">
        <div className="auth-error">
          <p className="error-title">
            {authError ? 'Authentication Error' : 'Loading Error'}
          </p>
          <p className="error-message">{authError || completionError || feedbackError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  function openAddForm() {
    setEditingActivity(null)
    setFormMode('add')
  }

  function openEditForm(activity) {
    setEditingActivity(activity)
    setFormMode('edit')
  }

  function closeForm() {
    setFormMode(null)
    setEditingActivity(null)
  }

  function openPhotoUpload(activity = null) {
    if (activity) {
      setPreselectedPhoto({
        dayDate: activity.date,
        activityId: activity.id,
      })
    } else {
      setPreselectedPhoto(null)
    }
    setShowPhotoUpload(true)
  }

  function closePhotoUpload() {
    setShowPhotoUpload(false)
    setPreselectedPhoto(null)
  }

  function handleFormSubmit(formData) {
    if (formMode === 'add') {
      const success = addActivity(formData)
      if (success) closeForm()
      return success
    }

    if (formMode === 'edit' && editingActivity) {
      const success = editActivity(editingActivity.id, formData)
      if (success) closeForm()
      return success
    }

    return false
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteActivity(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const formInitialValues =
    formMode === 'edit' && editingActivity
      ? activityToForm(editingActivity)
      : createEmptyForm(selectedDay.date, selectedDay.city)

  return (
    <div className="app">
      {activeTab === 'wrapped' && (
        <Wrapped wrappedData={wrappedData} />
      )}

      {activeTab === 'today' ? (
        <main className="app-main">
          <TripHeader selectedDay={selectedDay} tripProgress={tripProgress} />
          
          <TravelerName user={user} onUpdate={updateDisplayName} />

          <DaySelector
            days={days}
            selectedDate={selectedDay.date}
            dayIndex={dayIndex}
            onSelectDate={setSelectedDate}
            onPrevious={goToPreviousDay}
            onNext={goToNextDay}
          />

          <LodgingCard lodging={selectedDay.lodging} />

          <NextActivityCard
            activity={nextActivity}
            sharedLocation={nextActivity ? getLocation(nextActivity.id) : null}
            isEmpty={isEmptyDay}
            onAddActivity={openAddForm}
            onAddLocation={openLocationModal}
          />

          <AnchorsCard anchors={fixedActivities} />

          <section className="plan-section" aria-label="Today's plan">
          <div className="section-header">
            <h2 className="section-title">Day plan</h2>
            <p className="day-progress">
              {dayProgress.completed} of {dayProgress.total} completed
            </p>
          </div>

          {selectedDay.activities.length > 0 ? (
            <ul className="activity-list">
              {selectedDay.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  sharedLocation={getLocation(activity.id)}
                  onToggleComplete={handleToggleComplete}
                  onSetRating={setRating}
                  onToggleFavorite={toggleFavorite}
                  onSetMemory={setMemory}
                  onAddPhoto={openPhotoUpload}
                  onAddLocation={openLocationModal}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
                  user={user}
                  userFeedback={getUserFeedback(activity.id)}
                  allMemories={getAllMemories(activity.id)}
                  averageRating={getAverageRating(activity.id)}
                  favoriteCount={getFavoriteCount(activity.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="empty-state">Nothing on the plan yet.</p>
          )}

          <button
            type="button"
            className="btn btn-secondary add-activity-btn"
            onClick={openAddForm}
          >
            Add Activity
          </button>
        </section>

          <ReflectionCard
            date={selectedDay.date}
            tripDates={tripDates}
            answer={reflections[selectedDay.date] ?? ''}
            onChange={setReflection}
          />
        </main>
      ) : activeTab === 'photos' ? (
        <main className="app-main">
          <div className="photo-header">
            <h1 className="title">Trip Photos</h1>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowPhotoUpload(true)}
            >
              Add Photo
            </button>
          </div>

          <PhotoGallery
            photos={photos}
            loading={photosLoading}
            error={photosError}
            tripDates={tripDates}
            days={days}
            user={user}
            onDelete={deletePhoto}
          />
        </main>
      ) : activeTab === 'trip' ? (
        <TripHub
          allActivities={allActivities}
          completionState={completionState}
          getLocation={getLocation}
          onAddLocation={openLocationModal}
        />
      ) : activeTab === 'wrapped' ? (
        <Wrapped wrappedData={wrappedData} />
      ) : null}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {formMode && (
        <Modal
          title={formMode === 'add' ? 'Add Activity' : 'Edit Activity'}
          onClose={closeForm}
        >
          <ActivityForm
            initialValues={formInitialValues}
            tripDates={tripDates}
            days={days}
            submitLabel={formMode === 'add' ? 'Add Activity' : 'Save Changes'}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Activity" onClose={() => setDeleteTarget(null)}>
          <p className="confirm-text">
            Delete &ldquo;{deleteTarget.title}&rdquo;? This cannot be undone.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {showPhotoUpload && (
        <Modal title="Add Photo" onClose={closePhotoUpload}>
          <PhotoUpload
            user={user}
            tripDates={tripDates}
            days={days}
            initialDayDate={preselectedPhoto?.dayDate}
            initialActivityId={preselectedPhoto?.activityId}
            onClose={closePhotoUpload}
            onSuccess={closePhotoUpload}
          />
        </Modal>
      )}

      {locationActivity && (
        <Modal 
          title={getLocation(locationActivity.id) ? 'Edit Address' : 'Add Address'} 
          onClose={closeLocationModal}
        >
          <AddLocationModal
            activity={locationActivity}
            existingLocation={getLocation(locationActivity.id)}
            onSave={saveLocation}
            onClose={closeLocationModal}
          />
        </Modal>
      )}
    </div>
  )
}

export default App
