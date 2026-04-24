import type { Person, Schedule } from '../types'
import { ShiftCell } from './ShiftCell'
import { getDaysInRange, formatDate } from '../utils/dates'

interface ShiftGridProps {
  schedule: Schedule
  allPeople: Person[]
  onRemovePerson: (shiftId: string, personId: string) => void
}

export function ShiftGrid({ schedule, allPeople, onRemovePerson }: ShiftGridProps) {
  const days = getDaysInRange(schedule.startDate, schedule.endDate)
  const timeSlots = Array.from(new Set(schedule.shifts.map(s => `${s.startTime}-${s.endTime}`))).sort()

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${days.length}, minmax(120px, 1fr))` }}>
        <div />
        {days.map(day => (<div key={day} className="text-center font-medium text-sm text-gray-700 pb-2">{formatDate(day)}</div>))}

        {timeSlots.map(slot => {
          const [startTime, endTime] = slot.split('-')
          return [
            <div key={`label-${slot}`} className="text-xs text-gray-500 flex items-center">{startTime}–{endTime}</div>,
            ...days.map(day => {
              const shift = schedule.shifts.find(s => s.date === day && s.startTime === startTime && s.endTime === endTime)
              if (!shift) return <div key={`${day}-${slot}`} />
              const assignedPeople = (schedule.assignments[shift.id] || []).map(id => allPeople.find(p => p.id === id)).filter((p): p is Person => p !== undefined)
              return (<ShiftCell key={shift.id} shift={shift} assignedPeople={assignedPeople} schedule={schedule} allPeople={allPeople} onRemovePerson={(personId) => onRemovePerson(shift.id, personId)} />)
            }),
          ]
        })}
      </div>
    </div>
  )
}
