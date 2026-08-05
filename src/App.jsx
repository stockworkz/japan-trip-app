import { useState } from 'react'
import ActivityCard from './components/ActivityCard'
import ActivityForm from './components/ActivityForm'
import AnchorsCard from './components/AnchorsCard'
import BottomNav from './components/BottomNav'
import DaySelector from './components/DaySelector'
import LodgingCard from './components/LodgingCard'
import Modal from './components/Modal'
import NextActivityCard from './components/NextActivityCard'
import ReflectionCard from './components/ReflectionCard'
import TripHeader from './components/TripHeader'
import { useTripState } from './hooks/useTripState'
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
  const {
    days,
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
    toggleActivityComplete,
    setActivityRating,
    setActivityMemory,
    addActivity,
    editActivity,
    deleteActivity,
    setReflection,
    createEmptyForm,
  } = useTripState()

  const [formMode, setFormMode] = useState(null)
  const [editingActivity, setEditingActivity] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isEmptyDay = selectedDay.activities.length === 0
  const fixedActivities = getFixedActivities(selectedDay.activities)

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
      <main className="app-main">
        <TripHeader selectedDay={selectedDay} tripProgress={tripProgress} />

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
          isEmpty={isEmptyDay}
          onAddActivity={openAddForm}
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
                  onToggleComplete={toggleActivityComplete}
                  onSetRating={setActivityRating}
                  onSetMemory={setActivityMemory}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
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

      <BottomNav activeTab="today" />

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
    </div>
  )
}

export default App
