import { describe, it, expect } from 'vitest'
import { checkViolations } from '../../src/utils/constraints'
import { Person, Shift, Schedule } from '../../src/types'

const makePerson = (overrides: Partial<Person> = {}): Person => ({
  id: 'p1',
  name: 'David',
  notes: '',
  constraints: [],
  ...overrides,
})

const makeShift = (overrides: Partial<Shift> = {}): Shift => ({
  id: 's1',
  date: '2026-04-26',
  startTime: '08:00',
  endTime: '16:00',
  requiredCount: 2,
  ...overrides,
})

const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sch1',
  name: 'Test',
  startDate: '2026-04-26',
  endDate: '2026-04-30',
  participantIds: ['p1'],
  shifts: [],
  assignments: {},
  ...overrides,
})

describe('checkViolations', () => {
  it('returns empty array when no constraints', () => {
    const person = makePerson()
    const shift = makeShift()
    const schedule = makeSchedule()
    expect(checkViolations(person, shift, schedule, [person])).toEqual([])
  })

  it('detects unavailable_hours violation', () => {
    const person = makePerson({
      constraints: [{ type: 'unavailable_hours', ranges: [{ start: '18:00', end: '23:59' }] }],
    })
    const shift = makeShift({ startTime: '19:00', endTime: '23:00' })
    const result = checkViolations(person, shift, makeSchedule(), [person])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('unavailable')
  })

  it('allows shift outside unavailable hours', () => {
    const person = makePerson({
      constraints: [{ type: 'unavailable_hours', ranges: [{ start: '18:00', end: '23:59' }] }],
    })
    const shift = makeShift({ startTime: '08:00', endTime: '16:00' })
    expect(checkViolations(person, shift, makeSchedule(), [person])).toEqual([])
  })

  it('detects unavailable_days violation', () => {
    const person = makePerson({
      constraints: [{ type: 'unavailable_days', days: [0] }],
    })
    const shift = makeShift({ date: '2026-04-26' })
    const result = checkViolations(person, shift, makeSchedule(), [person])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('unavailable')
  })

  it('detects max_hours violation', () => {
    const person = makePerson({
      constraints: [{ type: 'max_hours', max: 10 }],
    })
    const shift1 = makeShift({ id: 's1', startTime: '08:00', endTime: '16:00' })
    const shift2 = makeShift({ id: 's2', date: '2026-04-27', startTime: '08:00', endTime: '16:00' })
    const schedule = makeSchedule({
      shifts: [shift1, shift2],
      assignments: { s1: ['p1'] },
    })
    const result = checkViolations(person, shift2, schedule, [person])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('max')
  })

  it('detects pair_must_not violation', () => {
    const person1 = makePerson({ id: 'p1', constraints: [{ type: 'pair_must_not', personId: 'p2' }] })
    const person2 = makePerson({ id: 'p2', name: 'Noa' })
    const shift = makeShift()
    const schedule = makeSchedule({
      shifts: [shift],
      assignments: { s1: ['p2'] },
    })
    const result = checkViolations(person1, shift, schedule, [person1, person2])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Noa')
  })

  it('detects pair_must violation when partner not assigned', () => {
    const person1 = makePerson({ id: 'p1', constraints: [{ type: 'pair_must', personId: 'p2' }] })
    const person2 = makePerson({ id: 'p2', name: 'Noa' })
    const shift = makeShift()
    const schedule = makeSchedule({
      shifts: [shift],
      assignments: { s1: [] },
    })
    const result = checkViolations(person1, shift, schedule, [person1, person2])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Noa')
  })
})
