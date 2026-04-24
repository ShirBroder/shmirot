import type { Person, Schedule } from '../types'
import { getAssignedHours } from '../utils/constraints'

interface HoursSummaryProps {
  schedule: Schedule
  participants: Person[]
}

export function HoursSummary({ schedule, participants }: HoursSummaryProps) {
  const hours = participants.map(p => ({ person: p, hours: getAssignedHours(p.id, schedule) })).sort((a, b) => b.hours - a.hours)

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="font-medium text-sm mb-2">Hours Summary</h3>
      <div className="space-y-1">
        {hours.map(({ person, hours: h }) => (
          <div key={person.id} className="flex justify-between text-sm">
            <span>{person.name}</span>
            <span className="font-mono text-gray-600">{h}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}
