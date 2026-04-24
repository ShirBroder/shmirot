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
