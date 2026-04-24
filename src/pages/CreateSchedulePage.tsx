import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeopleStore } from '../store/peopleStore'
import { useScheduleStore } from '../store/scheduleStore'
import { getDaysInRange, formatDate } from '../utils/dates'
import type { Shift } from '../types'

interface ShiftTemplate {
  startTime: string
  endTime: string
  requiredCount: number
}

export function CreateSchedulePage() {
  const navigate = useNavigate()
  const { people } = usePeopleStore()
  const { addSchedule } = useScheduleStore()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [dayShifts, setDayShifts] = useState<Record<string, ShiftTemplate[]>>({})
  const [assignmentMode, setAssignmentMode] = useState<'manual' | 'random' | 'smart'>('smart')

  const days = startDate && endDate ? getDaysInRange(startDate, endDate) : []

  const togglePerson = (id: string) => {
    const next = new Set(selectedPeople)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPeople(next)
  }

  const selectAll = () => setSelectedPeople(new Set(people.map(p => p.id)))
  const selectNone = () => setSelectedPeople(new Set())

  const addShiftToDay = (day: string) => {
    const current = dayShifts[day] || []
    setDayShifts({ ...dayShifts, [day]: [...current, { startTime: '08:00', endTime: '16:00', requiredCount: 1 }] })
  }

  const updateShiftTemplate = (day: string, index: number, updates: Partial<ShiftTemplate>) => {
    const current = dayShifts[day] || []
    setDayShifts({ ...dayShifts, [day]: current.map((s, i) => (i === index ? { ...s, ...updates } : s)) })
  }

  const removeShiftTemplate = (day: string, index: number) => {
    const current = dayShifts[day] || []
    setDayShifts({ ...dayShifts, [day]: current.filter((_, i) => i !== index) })
  }

  const copyDayShifts = (fromDay: string, toDays: string[]) => {
    const source = dayShifts[fromDay] || []
    const updated = { ...dayShifts }
    for (const day of toDays) {
      updated[day] = source.map(s => ({ ...s }))
    }
    setDayShifts(updated)
  }

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate || selectedPeople.size === 0) return

    const shifts: Shift[] = []
    for (const day of days) {
      for (const template of dayShifts[day] || []) {
        shifts.push({
          id: crypto.randomUUID(),
          date: day,
          startTime: template.startTime,
          endTime: template.endTime,
          requiredCount: template.requiredCount,
        })
      }
    }

    const scheduleId = addSchedule({
      name: name.trim(),
      startDate,
      endDate,
      participantIds: Array.from(selectedPeople),
      shifts,
      assignments: {},
    })

    navigate(`/schedule/${scheduleId}/assign?mode=${assignmentMode}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Schedule</h1>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow border space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. Week of April 26" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-medium">Participants</h2>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">Select All</button>
              <button onClick={selectNone} className="text-sm text-gray-500 hover:underline">None</button>
            </div>
          </div>
          {people.length === 0 ? (
            <p className="text-gray-500 text-sm">No people added yet. Go to People page first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {people.map(person => (
                <label key={person.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedPeople.has(person.id)} onChange={() => togglePerson(person.id)} className="rounded" />
                  <span className="text-sm">{person.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {days.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow border">
            <h2 className="font-medium mb-3">Shifts</h2>
            <div className="space-y-4">
              {days.map(day => (
                <div key={day} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{formatDate(day)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => addShiftToDay(day)} className="text-blue-600 text-xs hover:underline">+ Add Shift</button>
                      {(dayShifts[day]?.length || 0) > 0 && (
                        <button onClick={() => { const otherDays = days.filter(d => d !== day); copyDayShifts(day, otherDays) }} className="text-green-600 text-xs hover:underline">Copy to all days</button>
                      )}
                    </div>
                  </div>
                  {(dayShifts[day] || []).map((shift, si) => (
                    <div key={si} className="flex items-center gap-2 ml-4 mb-1">
                      <input type="time" value={shift.startTime} onChange={e => updateShiftTemplate(day, si, { startTime: e.target.value })} className="border rounded px-2 py-1 text-sm" />
                      <span className="text-sm">to</span>
                      <input type="time" value={shift.endTime} onChange={e => updateShiftTemplate(day, si, { endTime: e.target.value })} className="border rounded px-2 py-1 text-sm" />
                      <input type="number" value={shift.requiredCount} onChange={e => updateShiftTemplate(day, si, { requiredCount: Number(e.target.value) })} className="border rounded px-2 py-1 text-sm w-16" min={1} title="People needed" />
                      <span className="text-xs text-gray-500">people</span>
                      <button onClick={() => removeShiftTemplate(day, si)} className="text-red-400 text-sm">x</button>
                    </div>
                  ))}
                  {(!dayShifts[day] || dayShifts[day].length === 0) && (
                    <p className="text-xs text-gray-400 ml-4">No shifts — click "+ Add Shift"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="font-medium mb-2">Assignment Mode</h2>
          <div className="space-y-2">
            {[
              { value: 'manual' as const, label: 'Manual', desc: 'Drag and drop people into shifts yourself' },
              { value: 'random' as const, label: 'Random', desc: 'Randomly assign respecting constraints' },
              { value: 'smart' as const, label: 'Smart', desc: 'Optimize for fair distribution + constraints' },
            ].map(mode => (
              <label key={mode.value} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="mode" checked={assignmentMode === mode.value} onChange={() => setAssignmentMode(mode.value)} className="mt-1" />
                <div>
                  <span className="text-sm font-medium">{mode.label}</span>
                  <p className="text-xs text-gray-500">{mode.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/')} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || !startDate || !endDate || selectedPeople.size === 0} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Create & Assign</button>
        </div>
      </div>
    </div>
  )
}
