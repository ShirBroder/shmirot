import { create } from 'zustand'
import type { Schedule, Shift } from '../types'

const STORAGE_KEY = 'shmirot-schedules'

function loadSchedules(): Schedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveSchedules(schedules: Schedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
}

interface ScheduleStore {
  schedules: Schedule[]
  addSchedule: (data: Omit<Schedule, 'id'>) => string
  updateSchedule: (id: string, updates: Partial<Schedule>) => void
  updateAssignments: (id: string, assignments: Record<string, string[]>) => void
  updateShifts: (id: string, shifts: Shift[]) => void
  removeSchedule: (id: string) => void
  reset: () => void
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: loadSchedules(),

  addSchedule: (data) => {
    const schedule: Schedule = { ...data, id: crypto.randomUUID() }
    const schedules = [...get().schedules, schedule]
    saveSchedules(schedules)
    set({ schedules })
    return schedule.id
  },

  updateSchedule: (id, updates) => {
    const schedules = get().schedules.map(s =>
      s.id === id ? { ...s, ...updates } : s
    )
    saveSchedules(schedules)
    set({ schedules })
  },

  updateAssignments: (id, assignments) => {
    const schedules = get().schedules.map(s =>
      s.id === id ? { ...s, assignments } : s
    )
    saveSchedules(schedules)
    set({ schedules })
  },

  updateShifts: (id, shifts) => {
    const schedules = get().schedules.map(s =>
      s.id === id ? { ...s, shifts } : s
    )
    saveSchedules(schedules)
    set({ schedules })
  },

  removeSchedule: (id) => {
    const schedules = get().schedules.filter(s => s.id !== id)
    saveSchedules(schedules)
    set({ schedules })
  },

  reset: () => {
    saveSchedules([])
    set({ schedules: [] })
  },
}))
