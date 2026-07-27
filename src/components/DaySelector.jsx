export default function DaySelector({
  days,
  selectedDate,
  dayIndex,
  onSelectDate,
  onPrevious,
  onNext,
}) {
  return (
    <nav className="day-selector" aria-label="Trip days">
      <div className="day-strip">
        {days.map((day) => {
          const shortLabel = day.displayDate.replace('August ', 'Aug ')
          const isSelected = day.date === selectedDate

          return (
            <button
              key={day.date}
              type="button"
              className={`day-pill${isSelected ? ' selected' : ''}`}
              onClick={() => onSelectDate(day.date)}
              aria-current={isSelected ? 'date' : undefined}
            >
              {shortLabel}
            </button>
          )
        })}
      </div>
      <div className="day-nav">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={dayIndex === 0}
          onClick={onPrevious}
        >
          Previous Day
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={dayIndex === days.length - 1}
          onClick={onNext}
        >
          Next Day
        </button>
      </div>
    </nav>
  )
}
