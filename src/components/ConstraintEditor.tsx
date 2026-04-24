import { useState } from 'react'
import type { Constraint, ConstraintType, Person } from '../types'

const CONSTRAINT_LABELS: Record<ConstraintType, string> = {
  unavailable_hours: 'Unavailable Hours',
  unavailable_days: 'Unavailable Days',
  max_hours: 'Max Hours',
  pair_must_not: 'Must Not Work With',
  pair_must: 'Must Work With',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ConstraintEditorProps {
  constraints: Constraint[]
  onChange: (constraints: Constraint[]) => void
  allPeople: Person[]
  currentPersonId: string
}

export function ConstraintEditor({ constraints, onChange, allPeople, currentPersonId }: ConstraintEditorProps) {
  const [addingType, setAddingType] = useState<ConstraintType | ''>('')

  const addConstraint = () => {
    if (!addingType) return
    let newConstraint: Constraint
    switch (addingType) {
      case 'unavailable_hours':
        newConstraint = { type: 'unavailable_hours', ranges: [{ start: '18:00', end: '23:59' }] }
        break
      case 'unavailable_days':
        newConstraint = { type: 'unavailable_days', days: [] }
        break
      case 'max_hours':
        newConstraint = { type: 'max_hours', max: 40 }
        break
      case 'pair_must_not':
        newConstraint = { type: 'pair_must_not', personId: '' }
        break
      case 'pair_must':
        newConstraint = { type: 'pair_must', personId: '' }
        break
      default:
        return
    }
    onChange([...constraints, newConstraint])
    setAddingType('')
  }

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index))
  }

  const updateConstraint = (index: number, updated: Constraint) => {
    onChange(constraints.map((c, i) => (i === index ? updated : c)))
  }

  const otherPeople = allPeople.filter(p => p.id !== currentPersonId)

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Constraints</h4>

      {constraints.map((constraint, index) => (
        <div key={index} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{CONSTRAINT_LABELS[constraint.type]}</span>
            <button onClick={() => removeConstraint(index)} className="text-red-500 text-sm hover:text-red-700">Remove</button>
          </div>

          {constraint.type === 'unavailable_hours' && (
            <div className="space-y-2">
              {constraint.ranges.map((range, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <input type="time" value={range.start} onChange={e => {
                    const newRanges = [...constraint.ranges]
                    newRanges[ri] = { ...newRanges[ri], start: e.target.value }
                    updateConstraint(index, { ...constraint, ranges: newRanges })
                  }} className="border rounded px-2 py-1 text-sm" />
                  <span className="text-sm">to</span>
                  <input type="time" value={range.end} onChange={e => {
                    const newRanges = [...constraint.ranges]
                    newRanges[ri] = { ...newRanges[ri], end: e.target.value }
                    updateConstraint(index, { ...constraint, ranges: newRanges })
                  }} className="border rounded px-2 py-1 text-sm" />
                  <button onClick={() => {
                    const newRanges = constraint.ranges.filter((_, i) => i !== ri)
                    updateConstraint(index, { ...constraint, ranges: newRanges })
                  }} className="text-red-400 text-sm">x</button>
                </div>
              ))}
              <button onClick={() => {
                updateConstraint(index, { ...constraint, ranges: [...constraint.ranges, { start: '00:00', end: '06:00' }] })
              }} className="text-blue-600 text-sm hover:underline">+ Add time range</button>
            </div>
          )}

          {constraint.type === 'unavailable_days' && (
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day, di) => (
                <button key={di} onClick={() => {
                  const days = constraint.days.includes(di) ? constraint.days.filter(d => d !== di) : [...constraint.days, di]
                  updateConstraint(index, { ...constraint, days })
                }} className={`px-3 py-1 rounded text-sm ${constraint.days.includes(di) ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{day}</button>
              ))}
            </div>
          )}

          {constraint.type === 'max_hours' && (
            <input type="number" value={constraint.max} onChange={e => updateConstraint(index, { ...constraint, max: Number(e.target.value) })} className="border rounded px-2 py-1 text-sm w-24" min={1} />
          )}

          {(constraint.type === 'pair_must_not' || constraint.type === 'pair_must') && (
            <select value={constraint.personId} onChange={e => updateConstraint(index, { ...constraint, personId: e.target.value })} className="border rounded px-2 py-1 text-sm">
              <option value="">Select person...</option>
              {otherPeople.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <select value={addingType} onChange={e => setAddingType(e.target.value as ConstraintType | '')} className="border rounded px-2 py-1 text-sm flex-1">
          <option value="">Add constraint...</option>
          {Object.entries(CONSTRAINT_LABELS).map(([type, label]) => (<option key={type} value={type}>{label}</option>))}
        </select>
        <button onClick={addConstraint} disabled={!addingType} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50">Add</button>
      </div>
    </div>
  )
}
