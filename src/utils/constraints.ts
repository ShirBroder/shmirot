import type { Person, Shift, Schedule } from '../types'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getShiftDurationHours(shift: Shift): number {
  const start = timeToMinutes(shift.startTime)
  const end = timeToMinutes(shift.endTime)
  return (end - start) / 60
}

function getAssignedHours(personId: string, schedule: Schedule): number {
  let total = 0
  for (const shift of schedule.shifts) {
    const assigned = schedule.assignments[shift.id] || []
    if (assigned.includes(personId)) {
      total += getShiftDurationHours(shift)
    }
  }
  return total
}

function timeRangesOverlap(
  shiftStart: string, shiftEnd: string,
  rangeStart: string, rangeEnd: string
): boolean {
  const ss = timeToMinutes(shiftStart)
  const se = timeToMinutes(shiftEnd)
  const rs = timeToMinutes(rangeStart)
  const re = timeToMinutes(rangeEnd)
  return ss < re && se > rs
}

export function checkViolations(
  person: Person,
  shift: Shift,
  schedule: Schedule,
  allPeople: Person[]
): string[] {
  const violations: string[] = []
  const shiftDate = new Date(shift.date + 'T00:00:00')
  const dayOfWeek = shiftDate.getDay()

  for (const constraint of person.constraints) {
    switch (constraint.type) {
      case 'unavailable_hours': {
        for (const range of constraint.ranges) {
          if (timeRangesOverlap(shift.startTime, shift.endTime, range.start, range.end)) {
            violations.push(`${person.name}: unavailable ${range.start}–${range.end}`)
          }
        }
        break
      }
      case 'unavailable_days': {
        if (constraint.days.includes(dayOfWeek)) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          violations.push(`${person.name}: unavailable on ${dayNames[dayOfWeek]}`)
        }
        break
      }
      case 'max_hours': {
        const currentHours = getAssignedHours(person.id, schedule)
        const shiftHours = getShiftDurationHours(shift)
        if (currentHours + shiftHours > constraint.max) {
          violations.push(`${person.name}: max ${constraint.max}h exceeded (already ${currentHours}h + ${shiftHours}h)`)
        }
        break
      }
      case 'pair_must_not': {
        const assigned = schedule.assignments[shift.id] || []
        if (assigned.includes(constraint.personId)) {
          const other = allPeople.find(p => p.id === constraint.personId)
          violations.push(`${person.name}: must not work with ${other?.name || constraint.personId}`)
        }
        break
      }
      case 'pair_must': {
        const assigned = schedule.assignments[shift.id] || []
        if (!assigned.includes(constraint.personId)) {
          const other = allPeople.find(p => p.id === constraint.personId)
          violations.push(`${person.name}: must work with ${other?.name || constraint.personId}`)
        }
        break
      }
    }
  }

  return violations
}

export { getShiftDurationHours, getAssignedHours }
