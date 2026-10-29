import { describe, expect, it } from 'vitest'
import { emptyBook, registerInBook } from '../../registrations/domain/book'
import { SequentialIds } from '../../../shared/testing/sequentialIds'
import { checkInByToken, toggleCheckIn } from './attendance'

const now = new Date('2026-12-01T15:00:00.000Z')
const ids = new SequentialIds()
const person = (n: number) => ({ name: `P${n}`, email: `p${n}@x.com`, phone: '223555000', consent: true })

const bookWith = (capacity: number, n: number) => {
  let book = emptyBook('act')
  for (let i = 1; i <= n; i++) book = registerInBook(book, person(i), { capacity, now, ids }).book
  return book
}

describe('attendance rules', () => {
  it('checks in a confirmed registration by QR token', () => {
    const book = bookWith(2, 1)
    const out = checkInByToken(book, book.registrations[0].checkInToken, now)
    expect(out.registration.checkedInAt).toBe(now.toISOString())
  })

  it('rejects a second use of the same token', () => {
    const book = bookWith(2, 1)
    const once = checkInByToken(book, book.registrations[0].checkInToken, now).book
    expect(() => checkInByToken(once, book.registrations[0].checkInToken, now)).toThrowError(/already_checked_in/)
  })

  it('rejects unknown tokens', () => {
    expect(() => checkInByToken(bookWith(2, 1), 'nope', now)).toThrowError(/token_not_found/)
  })

  it('only confirmed registrations can check in', () => {
    const book = bookWith(1, 2)
    const waitlisted = book.registrations[1]
    expect(() => checkInByToken(book, waitlisted.checkInToken, now)).toThrowError(/not_confirmed/)
    expect(() => toggleCheckIn(book, waitlisted.id, now)).toThrowError(/not_confirmed/)
  })

  it('manual toggle checks in and undoes', () => {
    const book = bookWith(2, 1)
    const id = book.registrations[0].id
    const on = toggleCheckIn(book, id, now)
    expect(on.registration.checkedInAt).toBe(now.toISOString())
    expect(toggleCheckIn(on.book, id, now).registration.checkedInAt).toBeNull()
  })
})
