import { describe, it, expect } from 'vitest'
import { assignRandom } from '../../src/utils/assignRandom'
import { Person, Schedule, Shift } from '../../src/types'

const people: Person[] = [
  { id: 'p1', name: 'David', notes: '', constraints: [] },
  { id: 'p2', name: 'Noa', notes: '', constraints: [] },
  { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
]

const shifts: Shift[] = [
  { id: 's1', date: '2026-04-26', startTime: '08:00', endTime: '12:00', requiredCount: 2 },
  { id: 's2', date: '2026-04-26', startTime: '12:00', endTime: '16:00', requiredCount: 2 },
]

const schedule: Schedule = {
  id: 'sch1',
  name: 'Test',
  startDate: '2026-04-26',
  endDate: '2026-04-26',
  participantIds: ['p1', 'p2', 'p3'],
  shifts,
  assignments: {},
}

describe('assignRandom', () => {
  it('assigns the correct number of people per shift', () => {
    const result = assignRandom(schedule, people)
    expect(result['s1']).toHaveLength(2)
    expect(result['s2']).toHaveLength(2)
  })

  it('only assigns participants from the schedule', () => {
    const result = assignRandom(schedule, people)
    for (const shiftId of Object.keys(result)) {
      for (const personId of result[shiftId]) {
        expect(schedule.participantIds).toContain(personId)
      }
    }
  })

  it('respects unavailable_days constraint', () => {
    const constrained: Person[] = [
      { id: 'p1', name: 'David', notes: '', constraints: [{ type: 'unavailable_days', days: [0] }] },
      { id: 'p2', name: 'Noa', notes: '', constraints: [] },
      { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
    ]
    const result = assignRandom(schedule, constrained)
    expect(result['s1']).not.toContain('p1')
    expect(result['s2']).not.toContain('p1')
  })
})
