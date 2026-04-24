import { create } from 'zustand'
import type { Person, Constraint } from '../types'

const STORAGE_KEY = 'shmirot-people'

function loadPeople(): Person[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePeople(people: Person[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
}

interface PeopleStore {
  people: Person[]
  addPerson: (name: string, notes: string) => void
  updatePerson: (id: string, updates: Partial<Pick<Person, 'name' | 'notes' | 'constraints'>>) => void
  removePerson: (id: string) => void
  setConstraints: (personId: string, constraints: Constraint[]) => void
  reset: () => void
}

export const usePeopleStore = create<PeopleStore>((set, get) => ({
  people: loadPeople(),

  addPerson: (name, notes) => {
    const person: Person = {
      id: crypto.randomUUID(),
      name,
      notes,
      constraints: [],
    }
    const people = [...get().people, person]
    savePeople(people)
    set({ people })
  },

  updatePerson: (id, updates) => {
    const people = get().people.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
    savePeople(people)
    set({ people })
  },

  removePerson: (id) => {
    const people = get().people.filter(p => p.id !== id)
    savePeople(people)
    set({ people })
  },

  setConstraints: (personId, constraints) => {
    const people = get().people.map(p =>
      p.id === personId ? { ...p, constraints } : p
    )
    savePeople(people)
    set({ people })
  },

  reset: () => {
    savePeople([])
    set({ people: [] })
  },
}))
