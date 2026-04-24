import { Link } from 'react-router-dom'
import { useScheduleStore } from '../store/scheduleStore'
import { usePeopleStore } from '../store/peopleStore'
import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { exportData, downloadJson, parseImportData } from '../utils/storage'

export function HomePage() {
  const { schedules, removeSchedule } = useScheduleStore()
  const { people } = usePeopleStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleExport = () => {
    const json = exportData(people, schedules)
    downloadJson(json, `shmirot-backup-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const data = parseImportData(reader.result as string)
        if (!data) {
          alert('Invalid backup file')
          return
        }
        if (!confirm('This will replace all current data. Continue?')) return
        localStorage.setItem('shmirot-people', JSON.stringify(data.people))
        localStorage.setItem('shmirot-schedules', JSON.stringify(data.schedules))
        window.location.reload()
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">Export Backup</button>
          <button onClick={handleImport} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">Import Backup</button>
          <Link to="/schedule/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Schedule</Link>
        </div>
      </div>

      {schedules.length === 0 && (
        <p className="text-gray-500 text-center py-8">No schedules yet. Click "+ New Schedule" to start.</p>
      )}

      <div className="space-y-2">
        {schedules.map(schedule => (
          <div key={schedule.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
            <div>
              <h3 className="font-medium">{schedule.name}</h3>
              <p className="text-sm text-gray-500">{schedule.startDate} to {schedule.endDate} · {schedule.participantIds.length} participants · {schedule.shifts.length} shifts</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/schedule/${schedule.id}`} className="text-blue-600 text-sm hover:underline">View</Link>
              <Link to={`/schedule/${schedule.id}/assign`} className="text-green-600 text-sm hover:underline">Assign</Link>
              <button onClick={() => setDeleteId(schedule.id)} className="text-red-600 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={deleteId !== null} title="Delete Schedule" message="Are you sure you want to delete this schedule?" onConfirm={() => { if (deleteId) removeSchedule(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
