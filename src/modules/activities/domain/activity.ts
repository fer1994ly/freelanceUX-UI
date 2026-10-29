import { DomainError } from '../../../shared/errors'

export type ActivityStatus = 'draft' | 'published' | 'cancelled'

export interface Activity {
  id: string
  title: string
  description: string
  /** ISO date-time. `null` for a duplicate whose date was not set yet. */
  startsAt: string | null
  location: string
  capacity: number
  /** Informative price in ARS (no payment is processed). */
  priceArs: number
  status: ActivityStatus
  version: number
}

export type ActivityFields = Omit<Activity, 'id' | 'status' | 'version'>
export type ActivityInput = ActivityFields & { status?: ActivityStatus }

export function validateActivityFields(f: ActivityFields): void {
  if (!f.title.trim()) throw new DomainError('title_required')
  if (!Number.isInteger(f.capacity) || f.capacity < 1) throw new DomainError('capacity_invalid')
  if (!Number.isFinite(f.priceArs) || f.priceArs < 0) throw new DomainError('price_invalid')
  if (f.startsAt !== null && Number.isNaN(Date.parse(f.startsAt))) throw new DomainError('date_invalid')
}

export function createActivity(id: string, input: ActivityInput): Activity {
  validateActivityFields(input)
  return { ...input, title: input.title.trim(), id, status: input.status ?? 'published', version: 0 }
}

export function isUpcoming(a: Activity, now: Date): boolean {
  return a.status === 'published' && a.startsAt !== null && Date.parse(a.startsAt) > now.getTime()
}

/** Copies everything except identity, date and persistence version. */
export function duplicateActivity(source: Activity, newId: string): Activity {
  return { ...source, id: newId, startsAt: null, version: 0 }
}
