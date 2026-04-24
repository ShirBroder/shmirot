import { describe, it, expect, beforeEach } from 'vitest'
import { usePeopleStore } from '../../src/store/peopleStore'

describe('peopleStore', () => {
  beforeEach(() => {
    usePeopleStore.getState().reset()
    localStorage.clear()
  })

  it('starts with empty people list', () => {
    expect(usePeopleStore.getState().people).toEqual([])
  })

  it('adds a person', () => {
    usePeopleStore.getState().addPerson('David', 'test notes')
    const people = usePeopleStore.getState().people
    expect(people).toHaveLength(1)
    expect(people[0].name).toBe('David')
    expect(people[0].notes).toBe('test notes')
    expect(people[0].constraints).toEqual([])
  })

  it('updates a person', () => {
    usePeopleStore.getState().addPerson('David', '')
    const id = usePeopleStore.getState().people[0].id
    usePeopleStore.getState().updatePerson(id, { name: 'David B', notes: 'updated' })
    const person = usePeopleStore.getState().people[0]
    expect(person.name).toBe('David B')
    expect(person.notes).toBe('updated')
  })

  it('removes a person', () => {
    usePeopleStore.getState().addPerson('David', '')
    const id = usePeopleStore.getState().people[0].id
    usePeopleStore.getState().removePerson(id)
    expect(usePeopleStore.getState().people).toEqual([])
  })

  it('persists to localStorage', () => {
    usePeopleStore.getState().addPerson('David', '')
    const stored = JSON.parse(localStorage.getItem('shmirot-people') || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('David')
  })
})
