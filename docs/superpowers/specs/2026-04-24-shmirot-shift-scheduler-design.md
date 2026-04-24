# Shmirot — Shift Scheduling System Design

## Overview

A single-admin, mobile-friendly web app for workplace shift scheduling. The admin manages a master list of people with constraints, creates schedules for flexible date ranges, defines custom time-block shifts, and assigns people using one of three modes: manual drag-and-drop, random, or smart auto-generation. All data is client-side (localStorage) with JSON export/import for backup.

## Users

- Single admin (the operator). No worker-facing accounts or login system.
- The admin views and manages everything in the app; workers receive their schedules through external channels (WhatsApp, print, etc.).

## Data Model

### Person

| Field       | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| id          | string   | Unique identifier (UUID)                         |
| name        | string   | Person's display name                            |
| notes       | string   | Optional free-text notes (e.g., "prefers mornings") |
| constraints | array    | List of constraint objects (see below)           |

### Constraint

Constraints are per-person and extensible. Each constraint has a `type` field and type-specific data:

| Type               | Data                                      | Example                                    |
|--------------------|-------------------------------------------|--------------------------------------------|
| `unavailable_hours`| `{ ranges: { start: string, end: string }[] }` | Cannot work between 18:00–08:00       |
| `unavailable_days` | `{ days: number[] }`                      | Cannot work on Fridays (day 5)             |
| `max_hours`        | `{ max: number }`                         | Maximum 30 hours per schedule period       |
| `pair_must_not`    | `{ personId: string }`                    | Must not work the same shift as person X   |
| `pair_must`        | `{ personId: string }`                    | Must work the same shift as person Y       |

New constraint types can be added by defining a new `type` string and corresponding data shape. The UI renders constraint forms dynamically based on type.

### Schedule

| Field        | Type     | Description                                      |
|--------------|----------|--------------------------------------------------|
| id           | string   | Unique identifier (UUID)                         |
| name         | string   | Schedule name (e.g., "Week of April 26")         |
| startDate    | string   | ISO date string — start of the schedule period   |
| endDate      | string   | ISO date string — end of the schedule period     |
| participantIds | string[] | IDs of people from the master list participating |
| shifts       | array    | List of shift definitions (see below)            |
| assignments  | object   | Map of shiftId → array of personIds              |

### Shift

| Field        | Type     | Description                                      |
|--------------|----------|--------------------------------------------------|
| id           | string   | Unique identifier (UUID)                         |
| date         | string   | ISO date string                                  |
| startTime    | string   | HH:MM format (e.g., "08:00")                    |
| endTime      | string   | HH:MM format (e.g., "16:00")                    |
| requiredCount| number   | How many people are needed for this shift        |

## App Pages & Flow

### 1. People Management

- View the master list of all people
- Add a new person (name, notes)
- Edit a person's name, notes, constraints
- Remove a person (with confirmation)
- Constraint editor: add/edit/remove constraints per person, with a form that adapts to constraint type

### 2. Create Schedule

1. Enter schedule name and date range (start date, end date)
2. Define shifts: for each day in the range, add time blocks with start time, end time, and number of people needed. Support copying a day's shifts to other days for efficiency.
3. Select participants: show the full master list of people with checkboxes. Check off who participates in this schedule.
4. Choose assignment mode: Manual, Random, or Smart.

### 3. Assign Shifts

Three assignment modes, all available per schedule:

**Manual:**
- Grid view: days as columns, time slots as rows
- People sidebar on the left listing all participants
- Drag people from the sidebar into shift cells
- Constraint violations show a red highlight on the cell with a tooltip explaining which constraint is violated, but the drop is allowed (admin override)

**Random:**
- System randomly assigns participants to shifts, respecting constraints
- If a valid assignment isn't possible for all shifts (due to constraints), fill as many as possible and leave the rest unassigned
- Result is shown in the same grid view for manual adjustment

**Smart Auto-Generate:**
- Algorithm assigns participants to shifts while:
  - Respecting all constraints
  - Distributing hours as fairly as possible across participants
  - Minimizing constraint violations when a perfect solution isn't possible
- Result is shown in the same grid view for manual adjustment

After any mode, the admin can manually adjust by dragging people between cells or removing them.

### 4. View Schedule

- Grid layout: days as columns, time slots as rows, assigned people's names in each cell
- Constraint violations highlighted in red with tooltip
- Hours summary: shows total assigned hours per person (sidebar or bottom bar)
- Unassigned shifts: empty cells clearly marked (e.g., dashed border, "needs assignment" indicator)
- Mobile responsive: on narrow screens, the grid scrolls horizontally or collapses to a day-at-a-time card view

## Schedule View Layout

Grid layout with:
- **Columns:** One per day in the schedule date range
- **Rows:** One per unique time slot
- **Cells:** Show assigned people's names
- **Column headers:** Day name + date (e.g., "Sun 4/26")
- **Row headers:** Time range (e.g., "8:00–12:00")

## Constraint Violation Handling

- Violations are **warnings, not blockers** — the admin can always override
- Visual: red background/border on the affected cell
- Tooltip on hover/tap: explains the violation (e.g., "David: unavailable after 18:00")
- A violations summary count is shown at the top of the schedule view

## Fairness & Information Display

- **Hours per person:** A summary panel showing each participant's total assigned hours in this schedule
- **Unassigned shifts:** Empty shift cells have a distinct visual treatment (dashed border, muted color)
- **Assignment balance:** The smart mode optimizes for fair distribution; the summary panel makes imbalances visible in all modes

## Tech Stack

| Layer          | Technology  | Purpose                                      |
|----------------|-------------|----------------------------------------------|
| Framework      | React 18+   | UI components                                |
| Language       | TypeScript  | Type safety                                  |
| Build          | Vite        | Fast dev server and builds                   |
| Styling        | Tailwind CSS| Responsive, mobile-friendly design           |
| Drag & Drop    | dnd-kit     | Lightweight, modern drag-and-drop            |
| State          | Zustand     | Simple global state management               |
| Storage        | localStorage| Client-side persistence                      |
| Backup         | JSON export/import | Manual data backup/restore            |

## Storage & Backup

- All data (people, schedules) stored in localStorage as JSON
- Export: download all data as a single JSON file
- Import: upload a JSON file to restore data (with confirmation prompt to avoid accidental overwrite)
- No server, no database, no authentication

## Mobile Responsiveness

- Tailwind breakpoints for responsive layout
- On desktop: full grid view with people sidebar
- On mobile: grid scrolls horizontally, or switch to day-card view for easier reading
- Touch-friendly drag and drop via dnd-kit's touch sensor support

## Out of Scope (for now)

- Worker-facing accounts or login
- Export to PDF/spreadsheet
- Multi-device sync
- Notifications or reminders
- Shift swap requests
- Recurring schedule templates
