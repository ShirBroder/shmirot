import { describe, it, expect } from 'vitest'
import { assignSmart } from '../../src/utils/assignSmart'
import { Person, Schedule, Shift } from '../../src/types'

const people: Person[] = [
  { id: 'p1', name: 'David', notes: '', constraints: [] },
  { id: 'p2', name: 'Noa', notes: '', constraints: [] },
  { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
  { id: 'p4', name: 'Avi', notes: '', constraints: [] },
]

const shifts: Shift[] = [
  { id: 's1', date: '2026-04-26', startTime: '08:00', endTime: '12:00', requiredCount: 2 },
  { id: 's2', date: '2026-04-26', startTime: '12:00', endTime: '16:00', requiredCount: 2 },
  { id: 's3', date: '2026-04-27', startTime: '08:00', endTime: '12:00', requiredCount: 2 },
  { id: 's4', date: '2026-04-27', startTime: '12:00', endTime: '16:00', requiredCount: 2 },
]

const schedule: Schedule = {
  id: 'sch1',
  name: 'Test',
  startDate: '2026-04-26',
  endDate: '2026-04-27',
  participantIds: ['p1', 'p2', 'p3', 'p4'],
  shifts,
  assignments: {},
}

describe('assignSmart', () => {
  it('assigns the correct number of people per shift', () => {
    const result = assignSmart(schedule, people)
    for (const shift of shifts) {
      expect(result[shift.id]).toHaveLength(shift.requiredCount)
    }
  })

  it('distributes hours fairly across people', () => {
    const result = assignSmart(schedule, people)
    const hoursPerPerson: Record<string, number> = {}
    for (const shift of shifts) {
      for (const personId of result[shift.id]) {
        hoursPerPerson[personId] = (hoursPerPerson[personId] || 0) + 4
      }
    }
    const hours = Object.values(hoursPerPerson)
    const max = Math.max(...hours)
    const min = Math.min(...hours)
    expect(max - min).toBeLessThanOrEqual(4)
  })

  it('respects constraints', () => {
    const constrained: Person[] = [
      { id: 'p1', name: 'David', notes: '', constraints: [{ type: 'unavailable_days', days: [0] }] },
      { id: 'p2', name: 'Noa', notes: '', constraints: [] },
      { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
      { id: 'p4', name: 'Avi', notes: '', constraints: [] },
    ]
    const result = assignSmart(schedule, constrained)
    expect(result['s1']).not.toContain('p1')
    expect(result['s2']).not.toContain('p1')
  })
})
