import type { Person, Schedule } from '../types'
import { checkViolations, getAssignedHours } from './constraints'

export function assignSmart(
  schedule: Schedule,
  allPeople: Person[]
): Record<string, string[]> {
  const assignments: Record<string, string[]> = {}
  const participants = allPeople.filter(p => schedule.participantIds.includes(p.id))
  const workingSchedule: Schedule = { ...schedule, assignments }

  for (const shift of schedule.shifts) {
    const candidates = participants
      .filter(p => {
        const violations = checkViolations(p, shift, workingSchedule, allPeople)
        return violations.length === 0
      })
      .map(p => ({
        person: p,
        currentHours: getAssignedHours(p.id, workingSchedule),
      }))
      .sort((a, b) => a.currentHours - b.currentHours)

    const assigned: string[] = []
    for (const candidate of candidates) {
      if (assigned.length >= shift.requiredCount) break
      assigned.push(candidate.person.id)
    }

    assignments[shift.id] = assigned
  }

  return assignments
}
