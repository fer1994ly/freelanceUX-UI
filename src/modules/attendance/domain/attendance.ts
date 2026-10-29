import { DomainError } from '../../../shared/errors'
import type { Registration, RegistrationBook } from '../../registrations/domain/registration'

export interface AttendanceChange {
  book: RegistrationBook
  registration: Registration
}

const update = (book: RegistrationBook, r: Registration): AttendanceChange => ({
  book: { ...book, registrations: book.registrations.map((x) => (x.id === r.id ? r : x)) },
  registration: r,
})

function requireConfirmed(r: Registration): void {
  if (r.status !== 'confirmed') throw new DomainError('not_confirmed')
}

/** A QR token can be used once: a second scan is rejected. */
export function checkInByToken(book: RegistrationBook, token: string, now: Date): AttendanceChange {
  const r = book.registrations.find((x) => x.checkInToken === token)
  if (!r) throw new DomainError('token_not_found')
  requireConfirmed(r)
  if (r.checkedInAt) throw new DomainError('already_checked_in')
  return update(book, { ...r, checkedInAt: now.toISOString() })
}

/** Admin override: flips the attendance mark of a confirmed registration. */
export function toggleCheckIn(book: RegistrationBook, registrationId: string, now: Date): AttendanceChange {
  const r = book.registrations.find((x) => x.id === registrationId)
  if (!r) throw new DomainError('registration_not_found')
  requireConfirmed(r)
  return update(book, { ...r, checkedInAt: r.checkedInAt ? null : now.toISOString() })
}
