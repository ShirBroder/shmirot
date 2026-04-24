import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useScheduleStore } from '../store/scheduleStore'
import { usePeopleStore } from '../store/peopleStore'
import { DndContext, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ShiftGrid } from '../components/ShiftGrid'
import { PeopleSidebar } from '../components/PeopleSidebar'
import { HoursSummary } from '../components/HoursSummary'
import { assignRandom } from '../utils/assignRandom'
import { assignSmart } from '../utils/assignSmart'
import { checkViolations } from '../utils/constraints'
import { useEffect, useRef } from 'react'

export function AssignPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { schedules, updateAssignments } = useScheduleStore()
  const { people } = usePeopleStore()
  const hasAutoAssigned = useRef(false)

  const schedule = schedules.find(s => s.id === id)
  const mode = searchParams.get('mode') as 'manual' | 'random' | 'smart' | null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  useEffect(() => {
    if (!schedule || hasAutoAssigned.current) return
    if (mode === 'random' || mode === 'smart') {
      hasAutoAssigned.current = true
      const assignFn = mode === 'random' ? assignRandom : assignSmart
      const result = assignFn(schedule, people)
      updateAssignments(schedule.id, result)
    }
  }, [schedule, mode, people, updateAssignments])

  if (!schedule) {
    return <p className="text-center py-8 text-gray-500">Schedule not found.</p>
  }

  const participants = people.filter(p => schedule.participantIds.includes(p.id))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const personId = active.data.current?.personId as string
    const shiftId = over.id as string
    if (!personId || !shiftId) return
    const currentAssignments = { ...schedule.assignments }
    const assigned = currentAssignments[shiftId] || []
    if (assigned.includes(personId)) return
    currentAssignments[shiftId] = [...assigned, personId]
    updateAssignments(schedule.id, currentAssignments)
  }

  const handleRemovePerson = (shiftId: string, personId: string) => {
    const currentAssignments = { ...schedule.assignments }
    currentAssignments[shiftId] = (currentAssignments[shiftId] || []).filter(id => id !== personId)
    updateAssignments(schedule.id, currentAssignments)
  }

  const handleReassign = (mode: 'random' | 'smart') => {
    const assignFn = mode === 'random' ? assignRandom : assignSmart
    const result = assignFn(schedule, people)
    updateAssignments(schedule.id, result)
  }

  let violationCount = 0
  for (const shift of schedule.shifts) {
    const assigned = schedule.assignments[shift.id] || []
    for (const personId of assigned) {
      const person = people.find(p => p.id === personId)
      if (person) {
        violationCount += checkViolations(person, shift, schedule, people).length
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          <p className="text-sm text-gray-500">{schedule.startDate} to {schedule.endDate}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleReassign('random')} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Randomize</button>
          <button onClick={() => handleReassign('smart')} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Smart Assign</button>
          <button onClick={() => navigate(`/schedule/${schedule.id}`)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Done</button>
        </div>
      </div>

      {violationCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{violationCount} constraint violation{violationCount > 1 ? 's' : ''}</div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          <PeopleSidebar participants={participants} />
          <div className="flex-1">
            <ShiftGrid schedule={schedule} allPeople={people} onRemovePerson={handleRemovePerson} />
          </div>
        </div>
      </DndContext>

      <div className="mt-4">
        <HoursSummary schedule={schedule} participants={participants} />
      </div>
    </div>
  )
}
