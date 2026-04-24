import { useDraggable } from '@dnd-kit/core'
import type { Person } from '../types'

function DraggablePerson({ person }: { person: Person }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `person-${person.id}`,
    data: { personId: person.id },
  })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className={`px-3 py-2 bg-blue-100 rounded text-sm cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-50 shadow-lg' : ''}`}>
      {person.name}
    </div>
  )
}

interface PeopleSidebarProps {
  participants: Person[]
}

export function PeopleSidebar({ participants }: PeopleSidebarProps) {
  return (
    <div className="w-40 shrink-0">
      <h3 className="font-medium text-sm mb-2 text-gray-700">People</h3>
      <div className="space-y-1">
        {participants.map(person => (<DraggablePerson key={person.id} person={person} />))}
      </div>
    </div>
  )
}
