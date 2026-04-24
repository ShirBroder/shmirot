import { useState } from 'react'
import { usePeopleStore } from '../store/peopleStore'
import { PersonForm } from '../components/PersonForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Constraint } from '../types'

export function PeoplePage() {
  const { people, addPerson, updatePerson, removePerson, setConstraints } = usePeopleStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSave = (name: string, notes: string, constraints: Constraint[]) => {
    if (editingId) {
      updatePerson(editingId, { name, notes })
      setConstraints(editingId, constraints)
      setEditingId(null)
    } else {
      addPerson(name, notes)
      const newPeople = usePeopleStore.getState().people
      const newPerson = newPeople[newPeople.length - 1]
      if (constraints.length > 0) {
        setConstraints(newPerson.id, constraints)
      }
    }
    setShowForm(false)
  }

  const editingPerson = editingId ? people.find(p => p.id === editingId) : undefined

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">People</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null) }} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Add Person</button>
      </div>

      {(showForm || editingId) && (
        <div className="mb-4">
          <PersonForm person={editingPerson} allPeople={people} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingId(null) }} />
        </div>
      )}

      {people.length === 0 && !showForm && (
        <p className="text-gray-500 text-center py-8">No people added yet. Click "+ Add Person" to start.</p>
      )}

      <div className="space-y-2">
        {people.map(person => (
          <div key={person.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-start">
            <div>
              <h3 className="font-medium">{person.name}</h3>
              {person.notes && <p className="text-sm text-gray-500">{person.notes}</p>}
              {person.constraints.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{person.constraints.length} constraint{person.constraints.length > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(person.id); setShowForm(false) }} className="text-blue-600 text-sm hover:underline">Edit</button>
              <button onClick={() => setDeleteId(person.id)} className="text-red-600 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={deleteId !== null} title="Delete Person" message={`Are you sure you want to delete ${people.find(p => p.id === deleteId)?.name}?`} onConfirm={() => { if (deleteId) removePerson(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
