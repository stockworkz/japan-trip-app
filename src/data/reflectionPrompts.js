export const reflectionPrompts = [
  'What surprised you today?',
  'What made you laugh today?',
  'What would you absolutely do again?',
  'What food are you still thinking about?',
  'What was the most unexpected moment?',
  'What is one thing you do not want to forget?',
]

export function getReflectionPrompt(date, tripDates) {
  const index = tripDates.indexOf(date)
  const dayIndex = index >= 0 ? index : 0
  return reflectionPrompts[dayIndex % reflectionPrompts.length]
}
