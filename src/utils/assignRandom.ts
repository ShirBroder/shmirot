import type { Person, Schedule } from '../types'
import { checkViolations } from './constraints'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function assignRandom(
  schedule: Schedule,
  allPeople: Person[]
): Record<string, string[]> {
  const assignments: Record<string, string[]> = {}
  const participants = allPeople.filter(p => schedule.participantIds.includes(p.id))
  const workingSchedule: Schedule = { ...schedule, assignments }

  for (const shift of schedule.shifts) {
    const shuffled = shuffle(participants)
    const assigned: string[] = []

    for (const person of shuffled) {
      if (assigned.length >= shift.requiredCount) break
      const violations = checkViolations(person, shift, workingSchedule, allPeople)
      if (violations.length === 0) {
        assigned.push(person.id)
      }
    }

    assignments[shift.id] = assigned
  }

  return assignments
}
