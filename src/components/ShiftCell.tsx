import { useDroppable } from '@dnd-kit/core'
import type { Person, Shift, Schedule } from '../types'
import { checkViolations } from '../utils/constraints'

interface ShiftCellProps {
  shift: Shift
  assignedPeople: Person[]
  schedule: Schedule
  allPeople: Person[]
  onRemovePerson: (personId: string) => void
}

export function ShiftCell({ shift, assignedPeople, schedule, allPeople, onRemovePerson }: ShiftCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: shift.id })
  const isEmpty = assignedPeople.length === 0
  const needsMore = assignedPeople.length < shift.requiredCount

  return (
    <div ref={setNodeRef} className={`min-h-[60px] p-2 rounded border text-sm transition-colors ${isOver ? 'bg-blue-50 border-blue-300' : isEmpty ? 'border-dashed border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'}`}>
      {assignedPeople.map(person => {
        const violations = checkViolations(person, shift, schedule, allPeople)
        const hasViolation = violations.length > 0
        return (
          <div key={person.id} className={`flex items-center justify-between rounded px-2 py-1 mb-1 text-xs ${hasViolation ? 'bg-red-100 border border-red-300' : 'bg-blue-100'}`} title={hasViolation ? violations.join('\n') : ''}>
            <span>{person.name}</span>
            <button onClick={() => onRemovePerson(person.id)} className="text-gray-400 hover:text-red-500 ml-1">x</button>
          </div>
        )
      })}
      {needsMore && (
        <p className="text-xs text-gray-400 italic">{isEmpty ? `needs ${shift.requiredCount}` : `+${shift.requiredCount - assignedPeople.length} more`}</p>
      )}
    </div>
  )
}
