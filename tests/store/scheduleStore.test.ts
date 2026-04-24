import { describe, it, expect, beforeEach } from 'vitest'
import { useScheduleStore } from '../../src/store/scheduleStore'

describe('scheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.getState().reset()
    localStorage.clear()
  })

  it('starts with empty schedules list', () => {
    expect(useScheduleStore.getState().schedules).toEqual([])
  })

  it('adds a schedule', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: ['p1'],
      shifts: [],
      assignments: {},
    })
    const schedules = useScheduleStore.getState().schedules
    expect(schedules).toHaveLength(1)
    expect(schedules[0].name).toBe('Week 1')
  })

  it('updates assignments', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: ['p1'],
      shifts: [{ id: 's1', date: '2026-04-26', startTime: '08:00', endTime: '16:00', requiredCount: 1 }],
      assignments: {},
    })
    const id = useScheduleStore.getState().schedules[0].id
    useScheduleStore.getState().updateAssignments(id, { s1: ['p1'] })
    expect(useScheduleStore.getState().schedules[0].assignments).toEqual({ s1: ['p1'] })
  })

  it('removes a schedule', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: [],
      shifts: [],
      assignments: {},
    })
    const id = useScheduleStore.getState().schedules[0].id
    useScheduleStore.getState().removeSchedule(id)
    expect(useScheduleStore.getState().schedules).toEqual([])
  })

  it('persists to localStorage', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: [],
      shifts: [],
      assignments: {},
    })
    const stored = JSON.parse(localStorage.getItem('shmirot-schedules') || '[]')
    expect(stored).toHaveLength(1)
  })
})
