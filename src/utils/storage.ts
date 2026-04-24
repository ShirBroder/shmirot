import type { Person } from '../types'
import type { Schedule } from '../types'

interface ExportData {
  version: 1
  exportedAt: string
  people: Person[]
  schedules: Schedule[]
}

export function exportData(people: Person[], schedules: Schedule[]): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    people,
    schedules,
  }
  return JSON.stringify(data, null, 2)
}

export function downloadJson(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportData(json: string): ExportData | null {
  try {
    const data = JSON.parse(json)
    if (data.version === 1 && Array.isArray(data.people) && Array.isArray(data.schedules)) {
      return data as ExportData
    }
    return null
  } catch {
    return null
  }
}
