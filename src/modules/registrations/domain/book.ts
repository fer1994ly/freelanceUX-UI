import { HOUR_MS } from '../../../shared/clock'
import { DomainError } from '../../../shared/errors'
import type { IdGenerator } from '../../../shared/ids'
import {
  OFFER_WINDOW_HOURS,
  type Registration,
  type RegistrationBook,
  type RegistrationEvent,
} from './registration'

export interface RegistrantInput {
  name: string
  email: string
  phone: string
  consent: boolean
}

export interface BookContext {
  capacity: number
  now: Date
  ids: IdGenerator
}

export interface BookChange {
  book: RegistrationBook
  events: RegistrationEvent[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ACTIVE = new Set(['confirmed', 'waitlisted', 'offered'])

export const emptyBook = (activityId: string): RegistrationBook => ({
  id: activityId,
  registrations: [],
  version: 0,
})

/** Seats held: confirmed plus pending offers (an offer reserves its seat). */
export function occupiedSeats(book: RegistrationBook): number {
  return book.registrations.filter((r) => r.status === 'confirmed' || r.status === 'offered').length
}

/** 1-based place in the waitlist, or null when not waitlisted. */
export function waitlistPosition(book: RegistrationBook, registrationId: string): number | null {
  const queue = book.registrations.filter((r) => r.status === 'waitlisted')
  const idx = queue.findIndex((r) => r.id === registrationId)
  return idx === -1 ? null : idx + 1
}

export type RegistrantField = 'name' | 'email' | 'phone' | 'consent'

/** Field-level validation: maps each invalid field to its error code. */
export function registrantErrors(input: RegistrantInput): Partial<Record<RegistrantField, string>> {
  const errors: Partial<Record<RegistrantField, string>> = {}
  if (!input.name.trim()) errors.name = 'name_required'
  if (!EMAIL_RE.test(input.email.trim())) errors.email = 'email_invalid'
  if (input.phone.replace(/\D/g, '').length < 6) errors.phone = 'phone_invalid'
  if (input.consent !== true) errors.consent = 'consent_required'
  return errors
}

export function validateRegistrant(input: RegistrantInput): void {
  const first = Object.values(registrantErrors(input))[0]
  if (first) throw new DomainError(first)
}

const normalizeEmail = (e: string) => e.trim().toLowerCase()

const replace = (book: RegistrationBook, updated: Registration): RegistrationBook => ({
  ...book,
  registrations: book.registrations.map((r) => (r.id === updated.id ? updated : r)),
})

/** Offers every free seat to the head of the waitlist, in arrival order. */
function fillFreeSeats(book: RegistrationBook, ctx: BookContext): BookChange {
  const events: RegistrationEvent[] = []
  let current = book
  const expiresAt = new Date(ctx.now.getTime() + OFFER_WINDOW_HOURS * HOUR_MS).toISOString()
  while (occupiedSeats(current) < ctx.capacity) {
    const next = current.registrations.find((r) => r.status === 'waitlisted')
    if (!next) break
    current = replace(current, {
      ...next,
      status: 'offered',
      offerToken: ctx.ids.token(),
      offerExpiresAt: expiresAt,
    })
    events.push({ type: 'offered', registrationId: next.id })
  }
  return { book: current, events }
}

export function registerInBook(
  book: RegistrationBook,
  input: RegistrantInput,
  ctx: BookContext,
): BookChange & { registration: Registration } {
  validateRegistrant(input)
  const email = normalizeEmail(input.email)
  if (book.registrations.some((r) => ACTIVE.has(r.status) && normalizeEmail(r.email) === email)) {
    throw new DomainError('already_registered')
  }
  const hasQueue = book.registrations.some((r) => r.status === 'waitlisted')
  const confirmed = occupiedSeats(book) < ctx.capacity && !hasQueue
  const registration: Registration = {
    id: ctx.ids.id(),
    activityId: book.id,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    consent: true,
    status: confirmed ? 'confirmed' : 'waitlisted',
    createdAt: ctx.now.toISOString(),
    checkInToken: ctx.ids.token(),
    cancelToken: ctx.ids.token(),
    offerToken: null,
    offerExpiresAt: null,
    surveyToken: ctx.ids.token(),
    checkedInAt: null,
  }
  return {
    book: { ...book, registrations: [...book.registrations, registration] },
    events: [{ type: confirmed ? 'confirmed' : 'waitlisted', registrationId: registration.id }],
    registration,
  }
}

/** Expires overdue offers, then cascades free seats down the waitlist. */
export function resolveExpiredOffers(book: RegistrationBook, ctx: BookContext): BookChange {
  const nowMs = ctx.now.getTime()
  const expired = book.registrations.filter(
    (r) => r.status === 'offered' && r.offerExpiresAt !== null && Date.parse(r.offerExpiresAt) <= nowMs,
  )
  if (expired.length === 0) return fillFreeSeats(book, ctx)
  let current = book
  for (const r of expired) current = replace(current, { ...r, status: 'expired' })
  return fillFreeSeats(current, ctx)
}

export function cancelInBook(book: RegistrationBook, cancelToken: string, ctx: BookContext): BookChange {
  const target = book.registrations.find((r) => r.cancelToken === cancelToken)
  if (!target) throw new DomainError('registration_not_found')
  if (!ACTIVE.has(target.status)) throw new DomainError('not_cancellable')
  const cancelled = replace(book, { ...target, status: 'cancelled', offerToken: null, offerExpiresAt: null })
  const promoted = fillFreeSeats(cancelled, ctx)
  return {
    book: promoted.book,
    events: [{ type: 'cancelled', registrationId: target.id }, ...promoted.events],
  }
}

/** Callers should run `resolveExpiredOffers` first; expiry is re-checked here too. */
export function confirmOfferInBook(
  book: RegistrationBook,
  offerToken: string,
  ctx: BookContext,
): BookChange & { registration: Registration } {
  const target = book.registrations.find((r) => r.offerToken === offerToken)
  if (!target) throw new DomainError('offer_invalid')
  if (target.status === 'expired') throw new DomainError('offer_expired')
  if (target.status !== 'offered') throw new DomainError('offer_invalid')
  if (target.offerExpiresAt !== null && Date.parse(target.offerExpiresAt) <= ctx.now.getTime()) {
    throw new DomainError('offer_expired')
  }
  const registration: Registration = { ...target, status: 'confirmed', offerToken: null, offerExpiresAt: null }
  return {
    book: replace(book, registration),
    events: [{ type: 'confirmed', registrationId: target.id }],
    registration,
  }
}
