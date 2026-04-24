import { useParams, Link } from 'react-router-dom'
import { useScheduleStore } from '../store/scheduleStore'
import { usePeopleStore } from '../store/peopleStore'
import { ShiftGrid } from '../components/ShiftGrid'
import { HoursSummary } from '../components/HoursSummary'
import { checkViolations } from '../utils/constraints'

export function ViewSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const { schedules } = useScheduleStore()
  const { people } = usePeopleStore()

  const schedule = schedules.find(s => s.id === id)

  if (!schedule) {
    return <p className="text-center py-8 text-gray-500">Schedule not found.</p>
  }

  const participants = people.filter(p => schedule.participantIds.includes(p.id))

  let violationCount = 0
  let unassignedCount = 0
  for (const shift of schedule.shifts) {
    const assigned = schedule.assignments[shift.id] || []
    for (const personId of assigned) {
      const person = people.find(p => p.id === personId)
      if (person) {
        violationCount += checkViolations(person, shift, schedule, people).length
      }
    }
    if (assigned.length < shift.requiredCount) {
      unassignedCount += shift.requiredCount - assigned.length
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          <p className="text-sm text-gray-500">{schedule.startDate} to {schedule.endDate} · {participants.length} participants</p>
        </div>
        <Link to={`/schedule/${schedule.id}/assign`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit Assignments</Link>
      </div>

      <div className="flex gap-4 mb-4">
        {violationCount > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{violationCount} violation{violationCount > 1 ? 's' : ''}</div>
        )}
        {unassignedCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded text-sm">{unassignedCount} unassigned slot{unassignedCount > 1 ? 's' : ''}</div>
        )}
        {violationCount === 0 && unassignedCount === 0 && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">All shifts fully assigned, no violations</div>
        )}
      </div>

      <ShiftGrid schedule={schedule} allPeople={people} onRemovePerson={() => {}} />

      <div className="mt-4">
        <HoursSummary schedule={schedule} participants={participants} />
      </div>
    </div>
  )
}
