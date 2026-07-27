import { getReflectionPrompt } from '../data/reflectionPrompts'

export default function ReflectionCard({
  date,
  tripDates,
  answer,
  onChange,
}) {
  const prompt = getReflectionPrompt(date, tripDates)

  return (
    <section className="reflection-card" aria-label="Daily reflection">
      <p className="card-label">Daily Reflection</p>
      <p className="reflection-prompt">{prompt}</p>
      <label className="sr-only" htmlFor={`reflection-${date}`}>
        {prompt}
      </label>
      <textarea
        id={`reflection-${date}`}
        className="reflection-input"
        rows={3}
        placeholder="One short answer..."
        value={answer}
        onChange={(event) => onChange(date, event.target.value)}
      />
    </section>
  )
}
