# Shmirot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side shift scheduling web app with people management, constraint handling, and three assignment modes (manual drag-and-drop, random, smart).

**Architecture:** Single-page React app with Zustand for state, localStorage for persistence. Four main pages: People Management, Create Schedule, Assign Shifts (grid + drag-and-drop), View Schedule. Scheduling algorithms run client-side.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, dnd-kit, Zustand, Vitest

---

## File Structure

```
src/
  main.tsx                    — App entry point
  App.tsx                     — Router and layout shell
  types.ts                    — All TypeScript types (Person, Constraint, Schedule, Shift)
  store/
    peopleStore.ts            — Zustand store for people CRUD + localStorage sync
    scheduleStore.ts          — Zustand store for schedules CRUD + localStorage sync
  utils/
    constraints.ts            — Constraint validation logic (check violations)
    assignRandom.ts           — Random assignment algorithm
    assignSmart.ts            — Smart assignment algorithm (fair distribution)
    storage.ts                — JSON export/import helpers
    dates.ts                  — Date/time utility helpers
  pages/
    PeoplePage.tsx            — People management list page
    CreateSchedulePage.tsx    — Schedule creation wizard
    AssignPage.tsx            — Shift assignment with grid + drag-and-drop
    ViewSchedulePage.tsx      — Read-only schedule view
    HomePage.tsx              — Dashboard with schedule list
  components/
    PersonForm.tsx            — Add/edit person form with constraint editor
    ConstraintEditor.tsx      — Dynamic constraint type forms
    ShiftGrid.tsx             — Grid component (days as columns, time slots as rows)
    ShiftCell.tsx             — Single cell in the grid (shows assigned people)
    PeopleSidebar.tsx         — Draggable people list sidebar
    HoursSummary.tsx          — Hours per person summary panel
    NavBar.tsx                — Top navigation bar
    ConfirmDialog.tsx         — Reusable confirmation dialog
tests/
  utils/
    constraints.test.ts      — Constraint validation tests
    assignRandom.test.ts     — Random assignment tests
    assignSmart.test.ts      — Smart assignment tests
  store/
    peopleStore.test.ts      — People store tests
    scheduleStore.test.ts    — Schedule store tests
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-router-dom
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind**

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
```

Add to `tsconfig.app.json` compilerOptions:
```json
"types": ["vitest/globals"]
```

- [ ] **Step 5: Update .gitignore**

Add `.superpowers/` to `.gitignore`.

- [ ] **Step 6: Create minimal App.tsx with router**

```tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-gray-800 text-white p-4 flex gap-4">
        <Link to="/" className="hover:text-blue-300">Home</Link>
        <Link to="/people" className="hover:text-blue-300">People</Link>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/people" element={<div>People</div>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 7: Verify app runs**

```bash
npm run dev
```

Expected: App opens in browser with nav bar and "Home" text.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold project with Vite, React, TypeScript, Tailwind, Vitest"
```

---

### Task 2: Types and Data Model

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Define all TypeScript types**

```ts
export type ConstraintType =
  | 'unavailable_hours'
  | 'unavailable_days'
  | 'max_hours'
  | 'pair_must_not'
  | 'pair_must'

export interface TimeRange {
  start: string // HH:MM
  end: string   // HH:MM
}

export interface UnavailableHoursConstraint {
  type: 'unavailable_hours'
  ranges: TimeRange[]
}

export interface UnavailableDaysConstraint {
  type: 'unavailable_days'
  days: number[] // 0=Sunday, 1=Monday, ...6=Saturday
}

export interface MaxHoursConstraint {
  type: 'max_hours'
  max: number
}

export interface PairMustNotConstraint {
  type: 'pair_must_not'
  personId: string
}

export interface PairMustConstraint {
  type: 'pair_must'
  personId: string
}

export type Constraint =
  | UnavailableHoursConstraint
  | UnavailableDaysConstraint
  | MaxHoursConstraint
  | PairMustNotConstraint
  | PairMustConstraint

export interface Person {
  id: string
  name: string
  notes: string
  constraints: Constraint[]
}

export interface Shift {
  id: string
  date: string        // ISO date string YYYY-MM-DD
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  requiredCount: number
}

export interface Schedule {
  id: string
  name: string
  startDate: string   // ISO date string
  endDate: string     // ISO date string
  participantIds: string[]
  shifts: Shift[]
  assignments: Record<string, string[]> // shiftId → personId[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts && git commit -m "feat: add TypeScript type definitions for data model"
```

---

### Task 3: Constraint Validation Logic

**Files:**
- Create: `src/utils/constraints.ts`, `tests/utils/constraints.test.ts`

- [ ] **Step 1: Write failing tests for constraint checking**

Create `tests/utils/constraints.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { checkViolations } from '../../src/utils/constraints'
import { Person, Shift, Schedule } from '../../src/types'

const makePerson = (overrides: Partial<Person> = {}): Person => ({
  id: 'p1',
  name: 'David',
  notes: '',
  constraints: [],
  ...overrides,
})

const makeShift = (overrides: Partial<Shift> = {}): Shift => ({
  id: 's1',
  date: '2026-04-26',
  startTime: '08:00',
  endTime: '16:00',
  requiredCount: 2,
  ...overrides,
})

const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sch1',
  name: 'Test',
  startDate: '2026-04-26',
  endDate: '2026-04-30',
  participantIds: ['p1'],
  shifts: [],
  assignments: {},
  ...overrides,
})

describe('checkViolations', () => {
  it('returns empty array when no constraints', () => {
    const person = makePerson()
    const shift = makeShift()
    const schedule = makeSchedule()
    expect(checkViolations(person, shift, schedule, [person])).toEqual([])
  })

  it('detects unavailable_hours violation', () => {
    const person = makePerson({
      constraints: [{ type: 'unavailable_hours', ranges: [{ start: '18:00', end: '23:59' }] }],
    })
    const shift = makeShift({ startTime: '19:00', endTime: '23:00' })
    const result = checkViolations(person, shift, makeSchedule(), [person])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('unavailable')
  })

  it('allows shift outside unavailable hours', () => {
    const person = makePerson({
      constraints: [{ type: 'unavailable_hours', ranges: [{ start: '18:00', end: '23:59' }] }],
    })
    const shift = makeShift({ startTime: '08:00', endTime: '16:00' })
    expect(checkViolations(person, shift, makeSchedule(), [person])).toEqual([])
  })

  it('detects unavailable_days violation', () => {
    const person = makePerson({
      constraints: [{ type: 'unavailable_days', days: [0] }], // Sunday
    })
    // 2026-04-26 is a Sunday
    const shift = makeShift({ date: '2026-04-26' })
    const result = checkViolations(person, shift, makeSchedule(), [person])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('unavailable')
  })

  it('detects max_hours violation', () => {
    const person = makePerson({
      constraints: [{ type: 'max_hours', max: 10 }],
    })
    const shift1 = makeShift({ id: 's1', startTime: '08:00', endTime: '16:00' }) // 8 hours
    const shift2 = makeShift({ id: 's2', date: '2026-04-27', startTime: '08:00', endTime: '16:00' }) // 8 more
    const schedule = makeSchedule({
      shifts: [shift1, shift2],
      assignments: { s1: ['p1'] }, // already assigned 8h
    })
    const result = checkViolations(person, shift2, schedule, [person])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('max')
  })

  it('detects pair_must_not violation', () => {
    const person1 = makePerson({ id: 'p1', constraints: [{ type: 'pair_must_not', personId: 'p2' }] })
    const person2 = makePerson({ id: 'p2', name: 'Noa' })
    const shift = makeShift()
    const schedule = makeSchedule({
      shifts: [shift],
      assignments: { s1: ['p2'] }, // p2 already assigned
    })
    const result = checkViolations(person1, shift, schedule, [person1, person2])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Noa')
  })

  it('detects pair_must violation when partner not assigned', () => {
    const person1 = makePerson({ id: 'p1', constraints: [{ type: 'pair_must', personId: 'p2' }] })
    const person2 = makePerson({ id: 'p2', name: 'Noa' })
    const shift = makeShift()
    const schedule = makeSchedule({
      shifts: [shift],
      assignments: { s1: [] }, // p2 NOT assigned
    })
    const result = checkViolations(person1, shift, schedule, [person1, person2])
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Noa')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/utils/constraints.test.ts
```

Expected: FAIL — `checkViolations` not found.

- [ ] **Step 3: Implement constraint validation**

Create `src/utils/constraints.ts`:
```ts
import { Person, Shift, Schedule } from '../types'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getShiftDurationHours(shift: Shift): number {
  const start = timeToMinutes(shift.startTime)
  const end = timeToMinutes(shift.endTime)
  return (end - start) / 60
}

function getAssignedHours(personId: string, schedule: Schedule): number {
  let total = 0
  for (const shift of schedule.shifts) {
    const assigned = schedule.assignments[shift.id] || []
    if (assigned.includes(personId)) {
      total += getShiftDurationHours(shift)
    }
  }
  return total
}

function timeRangesOverlap(
  shiftStart: string, shiftEnd: string,
  rangeStart: string, rangeEnd: string
): boolean {
  const ss = timeToMinutes(shiftStart)
  const se = timeToMinutes(shiftEnd)
  const rs = timeToMinutes(rangeStart)
  const re = timeToMinutes(rangeEnd)
  return ss < re && se > rs
}

export function checkViolations(
  person: Person,
  shift: Shift,
  schedule: Schedule,
  allPeople: Person[]
): string[] {
  const violations: string[] = []
  const shiftDate = new Date(shift.date + 'T00:00:00')
  const dayOfWeek = shiftDate.getDay()

  for (const constraint of person.constraints) {
    switch (constraint.type) {
      case 'unavailable_hours': {
        for (const range of constraint.ranges) {
          if (timeRangesOverlap(shift.startTime, shift.endTime, range.start, range.end)) {
            violations.push(`${person.name}: unavailable ${range.start}–${range.end}`)
          }
        }
        break
      }
      case 'unavailable_days': {
        if (constraint.days.includes(dayOfWeek)) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          violations.push(`${person.name}: unavailable on ${dayNames[dayOfWeek]}`)
        }
        break
      }
      case 'max_hours': {
        const currentHours = getAssignedHours(person.id, schedule)
        const shiftHours = getShiftDurationHours(shift)
        if (currentHours + shiftHours > constraint.max) {
          violations.push(`${person.name}: max ${constraint.max}h exceeded (already ${currentHours}h + ${shiftHours}h)`)
        }
        break
      }
      case 'pair_must_not': {
        const assigned = schedule.assignments[shift.id] || []
        if (assigned.includes(constraint.personId)) {
          const other = allPeople.find(p => p.id === constraint.personId)
          violations.push(`${person.name}: must not work with ${other?.name || constraint.personId}`)
        }
        break
      }
      case 'pair_must': {
        const assigned = schedule.assignments[shift.id] || []
        if (!assigned.includes(constraint.personId)) {
          const other = allPeople.find(p => p.id === constraint.personId)
          violations.push(`${person.name}: must work with ${other?.name || constraint.personId}`)
        }
        break
      }
    }
  }

  return violations
}

export { getShiftDurationHours, getAssignedHours }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/utils/constraints.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/constraints.ts tests/utils/constraints.test.ts && git commit -m "feat: add constraint validation logic with tests"
```

---

### Task 4: Assignment Algorithms

**Files:**
- Create: `src/utils/assignRandom.ts`, `src/utils/assignSmart.ts`, `tests/utils/assignRandom.test.ts`, `tests/utils/assignSmart.test.ts`

- [ ] **Step 1: Write failing tests for random assignment**

Create `tests/utils/assignRandom.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { assignRandom } from '../../src/utils/assignRandom'
import { Person, Schedule, Shift } from '../../src/types'

const people: Person[] = [
  { id: 'p1', name: 'David', notes: '', constraints: [] },
  { id: 'p2', name: 'Noa', notes: '', constraints: [] },
  { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
]

const shifts: Shift[] = [
  { id: 's1', date: '2026-04-26', startTime: '08:00', endTime: '12:00', requiredCount: 2 },
  { id: 's2', date: '2026-04-26', startTime: '12:00', endTime: '16:00', requiredCount: 2 },
]

const schedule: Schedule = {
  id: 'sch1',
  name: 'Test',
  startDate: '2026-04-26',
  endDate: '2026-04-26',
  participantIds: ['p1', 'p2', 'p3'],
  shifts,
  assignments: {},
}

describe('assignRandom', () => {
  it('assigns the correct number of people per shift', () => {
    const result = assignRandom(schedule, people)
    expect(result['s1']).toHaveLength(2)
    expect(result['s2']).toHaveLength(2)
  })

  it('only assigns participants from the schedule', () => {
    const result = assignRandom(schedule, people)
    for (const shiftId of Object.keys(result)) {
      for (const personId of result[shiftId]) {
        expect(schedule.participantIds).toContain(personId)
      }
    }
  })

  it('respects unavailable_days constraint', () => {
    const constrained: Person[] = [
      { id: 'p1', name: 'David', notes: '', constraints: [{ type: 'unavailable_days', days: [0] }] }, // Sun
      { id: 'p2', name: 'Noa', notes: '', constraints: [] },
      { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
    ]
    const result = assignRandom(schedule, constrained)
    // p1 should not be assigned to Sunday shifts
    expect(result['s1']).not.toContain('p1')
    expect(result['s2']).not.toContain('p1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/utils/assignRandom.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement random assignment**

Create `src/utils/assignRandom.ts`:
```ts
import { Person, Schedule } from '../types'
import { checkViolations } from './constraints'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function assignRandom(
  schedule: Schedule,
  allPeople: Person[]
): Record<string, string[]> {
  const assignments: Record<string, string[]> = {}
  const participants = allPeople.filter(p => schedule.participantIds.includes(p.id))

  // Build a working schedule to track running assignments (for max_hours etc.)
  const workingSchedule: Schedule = { ...schedule, assignments }

  for (const shift of schedule.shifts) {
    const shuffled = shuffle(participants)
    const assigned: string[] = []

    for (const person of shuffled) {
      if (assigned.length >= shift.requiredCount) break
      const violations = checkViolations(person, shift, workingSchedule, allPeople)
      if (violations.length === 0) {
        assigned.push(person.id)
      }
    }

    assignments[shift.id] = assigned
  }

  return assignments
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/utils/assignRandom.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Write failing tests for smart assignment**

Create `tests/utils/assignSmart.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { assignSmart } from '../../src/utils/assignSmart'
import { Person, Schedule, Shift } from '../../src/types'

const people: Person[] = [
  { id: 'p1', name: 'David', notes: '', constraints: [] },
  { id: 'p2', name: 'Noa', notes: '', constraints: [] },
  { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
  { id: 'p4', name: 'Avi', notes: '', constraints: [] },
]

const shifts: Shift[] = [
  { id: 's1', date: '2026-04-26', startTime: '08:00', endTime: '12:00', requiredCount: 2 },
  { id: 's2', date: '2026-04-26', startTime: '12:00', endTime: '16:00', requiredCount: 2 },
  { id: 's3', date: '2026-04-27', startTime: '08:00', endTime: '12:00', requiredCount: 2 },
  { id: 's4', date: '2026-04-27', startTime: '12:00', endTime: '16:00', requiredCount: 2 },
]

const schedule: Schedule = {
  id: 'sch1',
  name: 'Test',
  startDate: '2026-04-26',
  endDate: '2026-04-27',
  participantIds: ['p1', 'p2', 'p3', 'p4'],
  shifts,
  assignments: {},
}

describe('assignSmart', () => {
  it('assigns the correct number of people per shift', () => {
    const result = assignSmart(schedule, people)
    for (const shift of shifts) {
      expect(result[shift.id]).toHaveLength(shift.requiredCount)
    }
  })

  it('distributes hours fairly across people', () => {
    const result = assignSmart(schedule, people)
    // 4 shifts x 4h x 2 people = 32 person-hours across 4 people = 8h each
    const hoursPerPerson: Record<string, number> = {}
    for (const shift of shifts) {
      for (const personId of result[shift.id]) {
        hoursPerPerson[personId] = (hoursPerPerson[personId] || 0) + 4
      }
    }
    const hours = Object.values(hoursPerPerson)
    const max = Math.max(...hours)
    const min = Math.min(...hours)
    expect(max - min).toBeLessThanOrEqual(4) // within one shift of each other
  })

  it('respects constraints', () => {
    const constrained: Person[] = [
      { id: 'p1', name: 'David', notes: '', constraints: [{ type: 'unavailable_days', days: [0] }] },
      { id: 'p2', name: 'Noa', notes: '', constraints: [] },
      { id: 'p3', name: 'Sarah', notes: '', constraints: [] },
      { id: 'p4', name: 'Avi', notes: '', constraints: [] },
    ]
    // 2026-04-26 is a Sunday (day 0)
    const result = assignSmart(schedule, constrained)
    expect(result['s1']).not.toContain('p1')
    expect(result['s2']).not.toContain('p1')
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run tests/utils/assignSmart.test.ts
```

Expected: FAIL.

- [ ] **Step 7: Implement smart assignment**

Create `src/utils/assignSmart.ts`:
```ts
import { Person, Schedule } from '../types'
import { checkViolations, getAssignedHours, getShiftDurationHours } from './constraints'

export function assignSmart(
  schedule: Schedule,
  allPeople: Person[]
): Record<string, string[]> {
  const assignments: Record<string, string[]> = {}
  const participants = allPeople.filter(p => schedule.participantIds.includes(p.id))
  const workingSchedule: Schedule = { ...schedule, assignments }

  for (const shift of schedule.shifts) {
    // Score each candidate: lower assigned hours = higher priority
    const candidates = participants
      .filter(p => {
        const violations = checkViolations(p, shift, workingSchedule, allPeople)
        return violations.length === 0
      })
      .map(p => ({
        person: p,
        currentHours: getAssignedHours(p.id, workingSchedule),
      }))
      .sort((a, b) => a.currentHours - b.currentHours)

    const assigned: string[] = []
    for (const candidate of candidates) {
      if (assigned.length >= shift.requiredCount) break
      assigned.push(candidate.person.id)
    }

    assignments[shift.id] = assigned
  }

  return assignments
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/utils/assignSmart.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/utils/assignRandom.ts src/utils/assignSmart.ts tests/utils/assignRandom.test.ts tests/utils/assignSmart.test.ts && git commit -m "feat: add random and smart assignment algorithms with tests"
```

---

### Task 5: Zustand Stores with localStorage

**Files:**
- Create: `src/store/peopleStore.ts`, `src/store/scheduleStore.ts`, `tests/store/peopleStore.test.ts`, `tests/store/scheduleStore.test.ts`

- [ ] **Step 1: Write failing tests for people store**

Create `tests/store/peopleStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePeopleStore } from '../../src/store/peopleStore'

describe('peopleStore', () => {
  beforeEach(() => {
    usePeopleStore.getState().reset()
    localStorage.clear()
  })

  it('starts with empty people list', () => {
    expect(usePeopleStore.getState().people).toEqual([])
  })

  it('adds a person', () => {
    usePeopleStore.getState().addPerson('David', 'test notes')
    const people = usePeopleStore.getState().people
    expect(people).toHaveLength(1)
    expect(people[0].name).toBe('David')
    expect(people[0].notes).toBe('test notes')
    expect(people[0].constraints).toEqual([])
  })

  it('updates a person', () => {
    usePeopleStore.getState().addPerson('David', '')
    const id = usePeopleStore.getState().people[0].id
    usePeopleStore.getState().updatePerson(id, { name: 'David B', notes: 'updated' })
    const person = usePeopleStore.getState().people[0]
    expect(person.name).toBe('David B')
    expect(person.notes).toBe('updated')
  })

  it('removes a person', () => {
    usePeopleStore.getState().addPerson('David', '')
    const id = usePeopleStore.getState().people[0].id
    usePeopleStore.getState().removePerson(id)
    expect(usePeopleStore.getState().people).toEqual([])
  })

  it('persists to localStorage', () => {
    usePeopleStore.getState().addPerson('David', '')
    const stored = JSON.parse(localStorage.getItem('shmirot-people') || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('David')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/store/peopleStore.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement people store**

Create `src/store/peopleStore.ts`:
```ts
import { create } from 'zustand'
import { Person, Constraint } from '../types'

const STORAGE_KEY = 'shmirot-people'

function loadPeople(): Person[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePeople(people: Person[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
}

interface PeopleStore {
  people: Person[]
  addPerson: (name: string, notes: string) => void
  updatePerson: (id: string, updates: Partial<Pick<Person, 'name' | 'notes' | 'constraints'>>) => void
  removePerson: (id: string) => void
  setConstraints: (personId: string, constraints: Constraint[]) => void
  reset: () => void
}

export const usePeopleStore = create<PeopleStore>((set, get) => ({
  people: loadPeople(),

  addPerson: (name, notes) => {
    const person: Person = {
      id: crypto.randomUUID(),
      name,
      notes,
      constraints: [],
    }
    const people = [...get().people, person]
    savePeople(people)
    set({ people })
  },

  updatePerson: (id, updates) => {
    const people = get().people.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
    savePeople(people)
    set({ people })
  },

  removePerson: (id) => {
    const people = get().people.filter(p => p.id !== id)
    savePeople(people)
    set({ people })
  },

  setConstraints: (personId, constraints) => {
    const people = get().people.map(p =>
      p.id === personId ? { ...p, constraints } : p
    )
    savePeople(people)
    set({ people })
  },

  reset: () => {
    savePeople([])
    set({ people: [] })
  },
}))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/store/peopleStore.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Write failing tests for schedule store**

Create `tests/store/scheduleStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useScheduleStore } from '../../src/store/scheduleStore'

describe('scheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.getState().reset()
    localStorage.clear()
  })

  it('starts with empty schedules list', () => {
    expect(useScheduleStore.getState().schedules).toEqual([])
  })

  it('adds a schedule', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: ['p1'],
      shifts: [],
      assignments: {},
    })
    const schedules = useScheduleStore.getState().schedules
    expect(schedules).toHaveLength(1)
    expect(schedules[0].name).toBe('Week 1')
  })

  it('updates assignments', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: ['p1'],
      shifts: [{ id: 's1', date: '2026-04-26', startTime: '08:00', endTime: '16:00', requiredCount: 1 }],
      assignments: {},
    })
    const id = useScheduleStore.getState().schedules[0].id
    useScheduleStore.getState().updateAssignments(id, { s1: ['p1'] })
    expect(useScheduleStore.getState().schedules[0].assignments).toEqual({ s1: ['p1'] })
  })

  it('removes a schedule', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: [],
      shifts: [],
      assignments: {},
    })
    const id = useScheduleStore.getState().schedules[0].id
    useScheduleStore.getState().removeSchedule(id)
    expect(useScheduleStore.getState().schedules).toEqual([])
  })

  it('persists to localStorage', () => {
    useScheduleStore.getState().addSchedule({
      name: 'Week 1',
      startDate: '2026-04-26',
      endDate: '2026-04-30',
      participantIds: [],
      shifts: [],
      assignments: {},
    })
    const stored = JSON.parse(localStorage.getItem('shmirot-schedules') || '[]')
    expect(stored).toHaveLength(1)
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run tests/store/scheduleStore.test.ts
```

Expected: FAIL.

- [ ] **Step 7: Implement schedule store**

Create `src/store/scheduleStore.ts`:
```ts
import { create } from 'zustand'
import { Schedule, Shift } from '../types'

const STORAGE_KEY = 'shmirot-schedules'

function loadSchedules(): Schedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveSchedules(schedules: Schedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
}

interface ScheduleStore {
  schedules: Schedule[]
  addSchedule: (data: Omit<Schedule, 'id'>) => string
  updateSchedule: (id: string, updates: Partial<Schedule>) => void
  updateAssignments: (id: string, assignments: Record<string, string[]>) => void
  updateShifts: (id: string, shifts: Shift[]) => void
  removeSchedule: (id: string) => void
  reset: () => void
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: loadSchedules(),

  addSchedule: (data) => {
    const schedule: Schedule = { ...data, id: crypto.randomUUID() }
    const schedules = [...get().schedules, schedule]
    saveSchedules(schedules)
    set({ schedules })
    return schedule.id
  },

  updateSchedule: (id, updates) => {
    const schedules = get().schedules.map(s =>
      s.id === id ? { ...s, ...updates } : s
    )
    saveSchedules(schedules)
    set({ schedules })
  },

  updateAssignments: (id, assignments) => {
    const schedules = get().schedules.map(s =>
      s.id === id ? { ...s, assignments } : s
    )
    saveSchedules(schedules)
    set({ schedules })
  },

  updateShifts: (id, shifts) => {
    const schedules = get().schedules.map(s =>
      s.id === id ? { ...s, shifts } : s
    )
    saveSchedules(schedules)
    set({ schedules })
  },

  removeSchedule: (id) => {
    const schedules = get().schedules.filter(s => s.id !== id)
    saveSchedules(schedules)
    set({ schedules })
  },

  reset: () => {
    saveSchedules([])
    set({ schedules: [] })
  },
}))
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/store/scheduleStore.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/store/ tests/store/ && git commit -m "feat: add Zustand stores for people and schedules with localStorage persistence"
```

---

### Task 6: Date Utilities and JSON Export/Import

**Files:**
- Create: `src/utils/dates.ts`, `src/utils/storage.ts`

- [ ] **Step 1: Create date helpers**

Create `src/utils/dates.ts`:
```ts
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
```

- [ ] **Step 2: Create JSON export/import helpers**

Create `src/utils/storage.ts`:
```ts
import { Person } from '../types'
import { Schedule } from '../types'

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
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/dates.ts src/utils/storage.ts && git commit -m "feat: add date utilities and JSON export/import helpers"
```

---

### Task 7: Navigation and Layout Shell

**Files:**
- Create: `src/components/NavBar.tsx`, `src/components/ConfirmDialog.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create NavBar component**

Create `src/components/NavBar.tsx`:
```tsx
import { Link, useLocation } from 'react-router-dom'

export function NavBar() {
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/people', label: 'People' },
  ]

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center gap-6 shadow-md">
      <span className="text-lg font-bold text-blue-400">Shmirot</span>
      {links.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className={`hover:text-blue-300 transition-colors ${
            location.pathname === link.to ? 'text-blue-300 font-medium' : 'text-gray-300'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Create ConfirmDialog component**

Create `src/components/ConfirmDialog.tsx`:
```tsx
interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update App.tsx with all routes**

Replace `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { HomePage } from './pages/HomePage'
import { PeoplePage } from './pages/PeoplePage'
import { CreateSchedulePage } from './pages/CreateSchedulePage'
import { AssignPage } from './pages/AssignPage'
import { ViewSchedulePage } from './pages/ViewSchedulePage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="p-4 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/schedule/new" element={<CreateSchedulePage />} />
            <Route path="/schedule/:id/assign" element={<AssignPage />} />
            <Route path="/schedule/:id" element={<ViewSchedulePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 4: Create placeholder pages**

Create `src/pages/HomePage.tsx`:
```tsx
export function HomePage() {
  return <div>Home — placeholder</div>
}
```

Create `src/pages/PeoplePage.tsx`:
```tsx
export function PeoplePage() {
  return <div>People — placeholder</div>
}
```

Create `src/pages/CreateSchedulePage.tsx`:
```tsx
export function CreateSchedulePage() {
  return <div>Create Schedule — placeholder</div>
}
```

Create `src/pages/AssignPage.tsx`:
```tsx
export function AssignPage() {
  return <div>Assign — placeholder</div>
}
```

Create `src/pages/ViewSchedulePage.tsx`:
```tsx
export function ViewSchedulePage() {
  return <div>View Schedule — placeholder</div>
}
```

- [ ] **Step 5: Verify app runs with navigation**

```bash
npm run dev
```

Expected: Nav bar visible, clicking links routes between pages.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/pages/ src/App.tsx && git commit -m "feat: add navigation, layout shell, and placeholder pages"
```

---

### Task 8: People Management Page

**Files:**
- Modify: `src/pages/PeoplePage.tsx`
- Create: `src/components/PersonForm.tsx`, `src/components/ConstraintEditor.tsx`

- [ ] **Step 1: Create ConstraintEditor component**

Create `src/components/ConstraintEditor.tsx`:
```tsx
import { useState } from 'react'
import { Constraint, ConstraintType, Person } from '../types'

const CONSTRAINT_LABELS: Record<ConstraintType, string> = {
  unavailable_hours: 'Unavailable Hours',
  unavailable_days: 'Unavailable Days',
  max_hours: 'Max Hours',
  pair_must_not: 'Must Not Work With',
  pair_must: 'Must Work With',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ConstraintEditorProps {
  constraints: Constraint[]
  onChange: (constraints: Constraint[]) => void
  allPeople: Person[]
  currentPersonId: string
}

export function ConstraintEditor({ constraints, onChange, allPeople, currentPersonId }: ConstraintEditorProps) {
  const [addingType, setAddingType] = useState<ConstraintType | ''>('')

  const addConstraint = () => {
    if (!addingType) return
    let newConstraint: Constraint
    switch (addingType) {
      case 'unavailable_hours':
        newConstraint = { type: 'unavailable_hours', ranges: [{ start: '18:00', end: '23:59' }] }
        break
      case 'unavailable_days':
        newConstraint = { type: 'unavailable_days', days: [] }
        break
      case 'max_hours':
        newConstraint = { type: 'max_hours', max: 40 }
        break
      case 'pair_must_not':
        newConstraint = { type: 'pair_must_not', personId: '' }
        break
      case 'pair_must':
        newConstraint = { type: 'pair_must', personId: '' }
        break
      default:
        return
    }
    onChange([...constraints, newConstraint])
    setAddingType('')
  }

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index))
  }

  const updateConstraint = (index: number, updated: Constraint) => {
    onChange(constraints.map((c, i) => (i === index ? updated : c)))
  }

  const otherPeople = allPeople.filter(p => p.id !== currentPersonId)

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Constraints</h4>

      {constraints.map((constraint, index) => (
        <div key={index} className="border border-gray-200 rounded p-3 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{CONSTRAINT_LABELS[constraint.type]}</span>
            <button
              onClick={() => removeConstraint(index)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          </div>

          {constraint.type === 'unavailable_hours' && (
            <div className="space-y-2">
              {constraint.ranges.map((range, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.start}
                    onChange={e => {
                      const newRanges = [...constraint.ranges]
                      newRanges[ri] = { ...newRanges[ri], start: e.target.value }
                      updateConstraint(index, { ...constraint, ranges: newRanges })
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-sm">to</span>
                  <input
                    type="time"
                    value={range.end}
                    onChange={e => {
                      const newRanges = [...constraint.ranges]
                      newRanges[ri] = { ...newRanges[ri], end: e.target.value }
                      updateConstraint(index, { ...constraint, ranges: newRanges })
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => {
                      const newRanges = constraint.ranges.filter((_, i) => i !== ri)
                      updateConstraint(index, { ...constraint, ranges: newRanges })
                    }}
                    className="text-red-400 text-sm"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateConstraint(index, {
                    ...constraint,
                    ranges: [...constraint.ranges, { start: '00:00', end: '06:00' }],
                  })
                }}
                className="text-blue-600 text-sm hover:underline"
              >
                + Add time range
              </button>
            </div>
          )}

          {constraint.type === 'unavailable_days' && (
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day, di) => (
                <button
                  key={di}
                  onClick={() => {
                    const days = constraint.days.includes(di)
                      ? constraint.days.filter(d => d !== di)
                      : [...constraint.days, di]
                    updateConstraint(index, { ...constraint, days })
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    constraint.days.includes(di)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          {constraint.type === 'max_hours' && (
            <input
              type="number"
              value={constraint.max}
              onChange={e => updateConstraint(index, { ...constraint, max: Number(e.target.value) })}
              className="border rounded px-2 py-1 text-sm w-24"
              min={1}
            />
          )}

          {(constraint.type === 'pair_must_not' || constraint.type === 'pair_must') && (
            <select
              value={constraint.personId}
              onChange={e => updateConstraint(index, { ...constraint, personId: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Select person...</option>
              {otherPeople.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <select
          value={addingType}
          onChange={e => setAddingType(e.target.value as ConstraintType | '')}
          className="border rounded px-2 py-1 text-sm flex-1"
        >
          <option value="">Add constraint...</option>
          {Object.entries(CONSTRAINT_LABELS).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
        <button
          onClick={addConstraint}
          disabled={!addingType}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PersonForm component**

Create `src/components/PersonForm.tsx`:
```tsx
import { useState } from 'react'
import { Person, Constraint } from '../types'
import { ConstraintEditor } from './ConstraintEditor'

interface PersonFormProps {
  person?: Person
  allPeople: Person[]
  onSave: (name: string, notes: string, constraints: Constraint[]) => void
  onCancel: () => void
}

export function PersonForm({ person, allPeople, onSave, onCancel }: PersonFormProps) {
  const [name, setName] = useState(person?.name || '')
  const [notes, setNotes] = useState(person?.notes || '')
  const [constraints, setConstraints] = useState<Constraint[]>(person?.constraints || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), notes.trim(), constraints)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow border">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Enter name"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Optional notes..."
          rows={2}
        />
      </div>

      <ConstraintEditor
        constraints={constraints}
        onChange={setConstraints}
        allPeople={allPeople}
        currentPersonId={person?.id || ''}
      />

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {person ? 'Save' : 'Add Person'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Implement PeoplePage**

Replace `src/pages/PeoplePage.tsx`:
```tsx
import { useState } from 'react'
import { usePeopleStore } from '../store/peopleStore'
import { PersonForm } from '../components/PersonForm'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Constraint } from '../types'

export function PeoplePage() {
  const { people, addPerson, updatePerson, removePerson, setConstraints } = usePeopleStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSave = (name: string, notes: string, constraints: Constraint[]) => {
    if (editingId) {
      updatePerson(editingId, { name, notes })
      setConstraints(editingId, constraints)
      setEditingId(null)
    } else {
      addPerson(name, notes)
      // Need to set constraints on newly added person
      const newPeople = usePeopleStore.getState().people
      const newPerson = newPeople[newPeople.length - 1]
      if (constraints.length > 0) {
        setConstraints(newPerson.id, constraints)
      }
    }
    setShowForm(false)
  }

  const editingPerson = editingId ? people.find(p => p.id === editingId) : undefined

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">People</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Person
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="mb-4">
          <PersonForm
            person={editingPerson}
            allPeople={people}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingId(null) }}
          />
        </div>
      )}

      {people.length === 0 && !showForm && (
        <p className="text-gray-500 text-center py-8">No people added yet. Click "+ Add Person" to start.</p>
      )}

      <div className="space-y-2">
        {people.map(person => (
          <div key={person.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-start">
            <div>
              <h3 className="font-medium">{person.name}</h3>
              {person.notes && <p className="text-sm text-gray-500">{person.notes}</p>}
              {person.constraints.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {person.constraints.length} constraint{person.constraints.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingId(person.id); setShowForm(false) }}
                className="text-blue-600 text-sm hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteId(person.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Person"
        message={`Are you sure you want to delete ${people.find(p => p.id === deleteId)?.name}?`}
        onConfirm={() => { if (deleteId) removePerson(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
```

- [ ] **Step 4: Verify people page works**

```bash
npm run dev
```

Expected: Can add, edit, remove people. Constraints editor works. Data persists on refresh.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConstraintEditor.tsx src/components/PersonForm.tsx src/pages/PeoplePage.tsx && git commit -m "feat: add people management page with constraint editor"
```

---

### Task 9: Home Page with Schedule List

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Implement HomePage**

Replace `src/pages/HomePage.tsx`:
```tsx
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
        const { usePeopleStore: ps } = require('../store/peopleStore')
        const { useScheduleStore: ss } = require('../store/scheduleStore')
        ps.getState().reset()
        ss.getState().reset()
        for (const person of data.people) {
          localStorage.setItem('shmirot-people', JSON.stringify(data.people))
        }
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
          <button onClick={handleExport} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Export Backup
          </button>
          <button onClick={handleImport} className="px-3 py-2 text-sm border rounded hover:bg-gray-50">
            Import Backup
          </button>
          <Link
            to="/schedule/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Schedule
          </Link>
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
              <p className="text-sm text-gray-500">
                {schedule.startDate} to {schedule.endDate} · {schedule.participantIds.length} participants · {schedule.shifts.length} shifts
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/schedule/${schedule.id}`} className="text-blue-600 text-sm hover:underline">
                View
              </Link>
              <Link to={`/schedule/${schedule.id}/assign`} className="text-green-600 text-sm hover:underline">
                Assign
              </Link>
              <button onClick={() => setDeleteId(schedule.id)} className="text-red-600 text-sm hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        onConfirm={() => { if (deleteId) removeSchedule(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify home page works**

```bash
npm run dev
```

Expected: Shows schedule list (empty initially), export/import buttons, link to create new schedule.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx && git commit -m "feat: add home page with schedule list and backup export/import"
```

---

### Task 10: Create Schedule Page

**Files:**
- Modify: `src/pages/CreateSchedulePage.tsx`

- [ ] **Step 1: Implement CreateSchedulePage**

Replace `src/pages/CreateSchedulePage.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeopleStore } from '../store/peopleStore'
import { useScheduleStore } from '../store/scheduleStore'
import { getDaysInRange, formatDate } from '../utils/dates'
import { Shift } from '../types'

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
    setDayShifts({
      ...dayShifts,
      [day]: current.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    })
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
        {/* Name and dates */}
        <div className="bg-white p-4 rounded-lg shadow border space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. Week of April 26"
            />
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

        {/* Participants */}
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
                  <input
                    type="checkbox"
                    checked={selectedPeople.has(person.id)}
                    onChange={() => togglePerson(person.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{person.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Shifts per day */}
        {days.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow border">
            <h2 className="font-medium mb-3">Shifts</h2>
            <div className="space-y-4">
              {days.map(day => (
                <div key={day} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{formatDate(day)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => addShiftToDay(day)} className="text-blue-600 text-xs hover:underline">
                        + Add Shift
                      </button>
                      {(dayShifts[day]?.length || 0) > 0 && (
                        <button
                          onClick={() => {
                            const otherDays = days.filter(d => d !== day)
                            copyDayShifts(day, otherDays)
                          }}
                          className="text-green-600 text-xs hover:underline"
                        >
                          Copy to all days
                        </button>
                      )}
                    </div>
                  </div>
                  {(dayShifts[day] || []).map((shift, si) => (
                    <div key={si} className="flex items-center gap-2 ml-4 mb-1">
                      <input
                        type="time"
                        value={shift.startTime}
                        onChange={e => updateShiftTemplate(day, si, { startTime: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <span className="text-sm">to</span>
                      <input
                        type="time"
                        value={shift.endTime}
                        onChange={e => updateShiftTemplate(day, si, { endTime: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        value={shift.requiredCount}
                        onChange={e => updateShiftTemplate(day, si, { requiredCount: Number(e.target.value) })}
                        className="border rounded px-2 py-1 text-sm w-16"
                        min={1}
                        title="People needed"
                      />
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

        {/* Assignment mode */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="font-medium mb-2">Assignment Mode</h2>
          <div className="space-y-2">
            {[
              { value: 'manual' as const, label: 'Manual', desc: 'Drag and drop people into shifts yourself' },
              { value: 'random' as const, label: 'Random', desc: 'Randomly assign respecting constraints' },
              { value: 'smart' as const, label: 'Smart', desc: 'Optimize for fair distribution + constraints' },
            ].map(mode => (
              <label key={mode.value} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={assignmentMode === mode.value}
                  onChange={() => setAssignmentMode(mode.value)}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium">{mode.label}</span>
                  <p className="text-xs text-gray-500">{mode.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/')} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !startDate || !endDate || selectedPeople.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create & Assign
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify create schedule page works**

```bash
npm run dev
```

Expected: Can enter name, dates, select people, add shifts per day with "copy to all days", choose assignment mode, and submit.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CreateSchedulePage.tsx && git commit -m "feat: add create schedule page with shift templates and participant selection"
```

---

### Task 11: Shift Assignment Page with Drag-and-Drop

**Files:**
- Create: `src/components/ShiftGrid.tsx`, `src/components/ShiftCell.tsx`, `src/components/PeopleSidebar.tsx`, `src/components/HoursSummary.tsx`
- Modify: `src/pages/AssignPage.tsx`

- [ ] **Step 1: Create ShiftCell component**

Create `src/components/ShiftCell.tsx`:
```tsx
import { useDroppable } from '@dnd-kit/core'
import { Person, Shift, Schedule } from '../types'
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

  const isFull = assignedPeople.length >= shift.requiredCount
  const isEmpty = assignedPeople.length === 0
  const needsMore = assignedPeople.length < shift.requiredCount

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] p-2 rounded border text-sm transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' :
        isEmpty ? 'border-dashed border-gray-300 bg-gray-50' :
        'border-gray-200 bg-white'
      }`}
    >
      {assignedPeople.map(person => {
        const violations = checkViolations(person, shift, schedule, allPeople)
        const hasViolation = violations.length > 0

        return (
          <div
            key={person.id}
            className={`flex items-center justify-between rounded px-2 py-1 mb-1 text-xs ${
              hasViolation ? 'bg-red-100 border border-red-300' : 'bg-blue-100'
            }`}
            title={hasViolation ? violations.join('\n') : ''}
          >
            <span>{person.name}</span>
            <button
              onClick={() => onRemovePerson(person.id)}
              className="text-gray-400 hover:text-red-500 ml-1"
            >
              x
            </button>
          </div>
        )
      })}
      {needsMore && (
        <p className="text-xs text-gray-400 italic">
          {isEmpty ? `needs ${shift.requiredCount}` : `+${shift.requiredCount - assignedPeople.length} more`}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create PeopleSidebar component**

Create `src/components/PeopleSidebar.tsx`:
```tsx
import { useDraggable } from '@dnd-kit/core'
import { Person } from '../types'

function DraggablePerson({ person }: { person: Person }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `person-${person.id}`,
    data: { personId: person.id },
  })

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`px-3 py-2 bg-blue-100 rounded text-sm cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
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
        {participants.map(person => (
          <DraggablePerson key={person.id} person={person} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ShiftGrid component**

Create `src/components/ShiftGrid.tsx`:
```tsx
import { Person, Schedule } from '../types'
import { ShiftCell } from './ShiftCell'
import { getDaysInRange, formatDate } from '../utils/dates'

interface ShiftGridProps {
  schedule: Schedule
  allPeople: Person[]
  onRemovePerson: (shiftId: string, personId: string) => void
}

export function ShiftGrid({ schedule, allPeople, onRemovePerson }: ShiftGridProps) {
  const days = getDaysInRange(schedule.startDate, schedule.endDate)

  // Get unique time slots sorted by start time
  const timeSlots = Array.from(
    new Set(schedule.shifts.map(s => `${s.startTime}-${s.endTime}`))
  ).sort()

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `100px repeat(${days.length}, minmax(120px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div />
        {days.map(day => (
          <div key={day} className="text-center font-medium text-sm text-gray-700 pb-2">
            {formatDate(day)}
          </div>
        ))}

        {/* Data rows */}
        {timeSlots.map(slot => {
          const [startTime, endTime] = slot.split('-')
          return [
            <div key={`label-${slot}`} className="text-xs text-gray-500 flex items-center">
              {startTime}–{endTime}
            </div>,
            ...days.map(day => {
              const shift = schedule.shifts.find(
                s => s.date === day && s.startTime === startTime && s.endTime === endTime
              )
              if (!shift) return <div key={`${day}-${slot}`} />

              const assignedPeople = (schedule.assignments[shift.id] || [])
                .map(id => allPeople.find(p => p.id === id))
                .filter((p): p is Person => p !== undefined)

              return (
                <ShiftCell
                  key={shift.id}
                  shift={shift}
                  assignedPeople={assignedPeople}
                  schedule={schedule}
                  allPeople={allPeople}
                  onRemovePerson={(personId) => onRemovePerson(shift.id, personId)}
                />
              )
            }),
          ]
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create HoursSummary component**

Create `src/components/HoursSummary.tsx`:
```tsx
import { Person, Schedule } from '../types'
import { getAssignedHours } from '../utils/constraints'

interface HoursSummaryProps {
  schedule: Schedule
  participants: Person[]
}

export function HoursSummary({ schedule, participants }: HoursSummaryProps) {
  const hours = participants.map(p => ({
    person: p,
    hours: getAssignedHours(p.id, schedule),
  })).sort((a, b) => b.hours - a.hours)

  const totalViolations = 0 // Could compute from checkViolations

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
```

- [ ] **Step 5: Implement AssignPage with drag-and-drop**

Replace `src/pages/AssignPage.tsx`:
```tsx
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useScheduleStore } from '../store/scheduleStore'
import { usePeopleStore } from '../store/peopleStore'
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ShiftGrid } from '../components/ShiftGrid'
import { PeopleSidebar } from '../components/PeopleSidebar'
import { HoursSummary } from '../components/HoursSummary'
import { assignRandom } from '../utils/assignRandom'
import { assignSmart } from '../utils/assignSmart'
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

    if (assigned.includes(personId)) return // already assigned

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

  // Count violations
  let violationCount = 0
  for (const shift of schedule.shifts) {
    const assigned = schedule.assignments[shift.id] || []
    for (const personId of assigned) {
      const person = people.find(p => p.id === personId)
      if (person) {
        const { checkViolations } = require('../utils/constraints')
        const v = checkViolations(person, shift, schedule, people)
        violationCount += v.length
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
          <button onClick={() => handleReassign('random')} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
            Randomize
          </button>
          <button onClick={() => handleReassign('smart')} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
            Smart Assign
          </button>
          <button onClick={() => navigate(`/schedule/${schedule.id}`)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
            Done
          </button>
        </div>
      </div>

      {violationCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          {violationCount} constraint violation{violationCount > 1 ? 's' : ''}
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          <PeopleSidebar participants={participants} />
          <div className="flex-1">
            <ShiftGrid
              schedule={schedule}
              allPeople={people}
              onRemovePerson={handleRemovePerson}
            />
          </div>
        </div>
      </DndContext>

      <div className="mt-4">
        <HoursSummary schedule={schedule} participants={participants} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify drag-and-drop works**

```bash
npm run dev
```

Expected: Can create a schedule, see the grid, drag people from sidebar into shift cells, see violation warnings, re-assign with random/smart buttons, remove people from cells.

- [ ] **Step 7: Commit**

```bash
git add src/components/ShiftGrid.tsx src/components/ShiftCell.tsx src/components/PeopleSidebar.tsx src/components/HoursSummary.tsx src/pages/AssignPage.tsx && git commit -m "feat: add shift assignment page with drag-and-drop, grid view, and hours summary"
```

---

### Task 12: View Schedule Page

**Files:**
- Modify: `src/pages/ViewSchedulePage.tsx`

- [ ] **Step 1: Implement ViewSchedulePage**

Replace `src/pages/ViewSchedulePage.tsx`:
```tsx
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

  // Count violations
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

  // Count unassigned
  let unassignedCount = 0
  for (const shift of schedule.shifts) {
    const assigned = (schedule.assignments[shift.id] || []).length
    if (assigned < shift.requiredCount) {
      unassignedCount += shift.requiredCount - assigned
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          <p className="text-sm text-gray-500">{schedule.startDate} to {schedule.endDate} · {participants.length} participants</p>
        </div>
        <Link
          to={`/schedule/${schedule.id}/assign`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit Assignments
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        {violationCount > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {violationCount} violation{violationCount > 1 ? 's' : ''}
          </div>
        )}
        {unassignedCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded text-sm">
            {unassignedCount} unassigned slot{unassignedCount > 1 ? 's' : ''}
          </div>
        )}
        {violationCount === 0 && unassignedCount === 0 && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
            All shifts fully assigned, no violations
          </div>
        )}
      </div>

      <ShiftGrid
        schedule={schedule}
        allPeople={people}
        onRemovePerson={() => {}} // read-only view, no-op
      />

      <div className="mt-4">
        <HoursSummary schedule={schedule} participants={participants} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify view page works**

```bash
npm run dev
```

Expected: Shows read-only schedule grid with violation/unassigned indicators and hours summary.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ViewSchedulePage.tsx && git commit -m "feat: add read-only schedule view page with violation and unassigned indicators"
```

---

### Task 13: Fix require() Calls and Final Polish

**Files:**
- Modify: `src/pages/AssignPage.tsx`, `src/pages/HomePage.tsx`

- [ ] **Step 1: Fix AssignPage — replace require() with import**

In `src/pages/AssignPage.tsx`, replace the `require('../utils/constraints')` usage with a proper import at the top:

Add at the top of the file:
```tsx
import { checkViolations } from '../utils/constraints'
```

Replace the violation counting block:
```tsx
  let violationCount = 0
  for (const shift of schedule.shifts) {
    const assigned = schedule.assignments[shift.id] || []
    for (const personId of assigned) {
      const person = people.find(p => p.id === personId)
      if (person) {
        const v = checkViolations(person, shift, schedule, people)
        violationCount += v.length
      }
    }
  }
```

- [ ] **Step 2: Fix HomePage — replace require() import with proper import for backup restore**

In `src/pages/HomePage.tsx`, replace the `handleImport` function's restore logic. Instead of `require()`, use proper store access:

Replace the `reader.onload` callback:
```tsx
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
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Run the dev server and do a manual smoke test**

```bash
npm run dev
```

Smoke test checklist:
1. Add 3-4 people with various constraints
2. Create a schedule with a 3-day range
3. Add shifts to one day, copy to all days
4. Select participants and choose "Smart" mode
5. Verify grid shows assignments with fair distribution
6. Drag a person into a conflicting shift — see red warning
7. Remove a person from a shift
8. Click "Randomize" to re-assign
9. Click "Done" to view read-only schedule
10. Go home, verify schedule appears in list
11. Export backup, delete schedule, import backup to restore

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "fix: replace require() with proper imports, final polish"
```

- [ ] **Step 6: Build for production**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 7: Final commit if any build fixes needed**

```bash
git add -A && git commit -m "fix: resolve any build issues"
```
