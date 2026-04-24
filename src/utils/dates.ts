export function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const current = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const day = days[date.getDay()]
  const month = date.getMonth() + 1
  const dayOfMonth = date.getDate()
  return `${day} ${month}/${dayOfMonth}`
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}
