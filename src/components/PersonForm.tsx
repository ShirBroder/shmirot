import { useState } from 'react'
import type { Person, Constraint } from '../types'
import { ConstraintEditor } from './ConstraintEditor'

interface PersonFormProps {
  person?: Person
  allPeople: Person[]
  onSave: (name: string, notes: string, constraints: Constraint[]) => void
  onCancel: () => void
}

export function PersonForm({ person, allPeople, onSave, onCancel }: PersonFormProps) {
  const [name, setName] = useState(person?.name || '')
  const [notes, setNotes] = useState(person?.notes || '')
  const [constraints, setConstraints] = useState<Constraint[]>(person?.constraints || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), notes.trim(), constraints)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow border">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter name" autoFocus />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Optional notes..." rows={2} />
      </div>
      <ConstraintEditor constraints={constraints} onChange={setConstraints} allPeople={allPeople} currentPersonId={person?.id || ''} />
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{person ? 'Save' : 'Add Person'}</button>
      </div>
    </form>
  )
}
