import { beforeEach, describe, expect, it } from 'vitest'
import { FakeClock } from '../../../shared/testing/fakeClock'
import { SequentialIds } from '../../../shared/testing/sequentialIds'
import {
  cancelInBook,
  confirmOfferInBook,
  emptyBook,
  occupiedSeats,
  registerInBook,
  resolveExpiredOffers,
  waitlistPosition,
  type RegistrantInput,
} from './book'
import type { RegistrationBook } from './registration'

const person = (n: number): RegistrantInput => ({
  name: `Person ${n}`,
  email: `p${n}@example.com`,
  phone: '+54 223 555 0000',
  consent: true,
})

describe('registration book', () => {
  let clock: FakeClock
  let ids: SequentialIds
  const ctx = (capacity: number) => ({ capacity, now: clock.now(), ids })
  beforeEach(() => {
    clock = new FakeClock('2026-11-01T10:00:00.000Z')
    ids = new SequentialIds()
  })

  const fill = (n: number, capacity: number): RegistrationBook => {
    let book = emptyBook('act')
    for (let i = 1; i <= n; i++) book = registerInBook(book, person(i), ctx(capacity)).book
    return book
  }

  it('confirms while there are free seats and never exceeds capacity', () => {
    const book = fill(5, 3)
    expect(book.registrations.map((r) => r.status)).toEqual([
      'confirmed', 'confirmed', 'confirmed', 'waitlisted', 'waitlisted',
    ])
    expect(occupiedSeats(book)).toBe(3)
  })

  it('orders the waitlist by arrival and exposes positions', () => {
    const book = fill(5, 3)
    expect(waitlistPosition(book, book.registrations[3].id)).toBe(1)
    expect(waitlistPosition(book, book.registrations[4].id)).toBe(2)
    expect(waitlistPosition(book, book.registrations[0].id)).toBeNull()
  })

  it.each([
    ['name', { name: ' ' }],
    ['email', { email: 'not-an-email' }],
    ['phone', { phone: '12' }],
    ['consent', { consent: false }],
  ])('rejects invalid %s', (_n, patch) => {
    expect(() => registerInBook(emptyBook('act'), { ...person(1), ...patch }, ctx(2))).toThrow()
  })

  it('rejects the same email twice on one activity (case-insensitive)', () => {
    const book = fill(1, 3)
    expect(() =>
      registerInBook(book, { ...person(2), email: 'P1@Example.com' }, ctx(3)),
    ).toThrowError(/already_registered/)
  })

  it('issues distinct opaque tokens per registration', () => {
    const r = fill(1, 3).registrations[0]
    expect(new Set([r.checkInToken, r.cancelToken, r.offerToken, r.surveyToken].filter(Boolean)).size).toBe(3)
  })

  it('cancelling a confirmed seat offers it to the first waitlisted for 24h', () => {
    const book = fill(4, 3)
    const { book: after, events } = cancelInBook(book, book.registrations[0].cancelToken, ctx(3))
    const [, , , first] = after.registrations
    expect(after.registrations[0].status).toBe('cancelled')
    expect(first.status).toBe('offered')
    expect(first.offerExpiresAt).toBe('2026-11-02T10:00:00.000Z')
    expect(first.offerToken).toBeTruthy()
    expect(events.map((e) => e.type)).toEqual(['cancelled', 'offered'])
    expect(occupiedSeats(after)).toBe(3)
  })

  it('confirms an offer within the window', () => {
    let book = fill(4, 3)
    book = cancelInBook(book, book.registrations[0].cancelToken, ctx(3)).book
    clock.advanceHours(23)
    const { book: confirmed } = confirmOfferInBook(book, book.registrations[3].offerToken!, ctx(3))
    expect(confirmed.registrations[3].status).toBe('confirmed')
    expect(confirmed.registrations[3].offerToken).toBeNull()
  })

  it('expires an offer after 24h and cascades to the next in line', () => {
    let book = fill(5, 3)
    book = cancelInBook(book, book.registrations[0].cancelToken, ctx(3)).book
    clock.advanceHours(24)
    const { book: after, events } = resolveExpiredOffers(book, ctx(3))
    expect(after.registrations[3].status).toBe('expired')
    expect(after.registrations[4].status).toBe('offered')
    expect(after.registrations[4].offerExpiresAt).toBe('2026-11-03T10:00:00.000Z')
    expect(events.map((e) => e.type)).toEqual(['offered'])
    expect(occupiedSeats(after)).toBe(3)
  })

  it('refuses to confirm an expired offer', () => {
    let book = fill(4, 3)
    book = cancelInBook(book, book.registrations[0].cancelToken, ctx(3)).book
    const token = book.registrations[3].offerToken!
    clock.advanceHours(25)
    expect(() => confirmOfferInBook(book, token, ctx(3))).toThrowError(/offer_expired/)
  })

  it('cancelling a waitlisted entry does not promote anyone', () => {
    const book = fill(4, 3)
    const { book: after, events } = cancelInBook(book, book.registrations[3].cancelToken, ctx(3))
    expect(after.registrations[3].status).toBe('cancelled')
    expect(events.map((e) => e.type)).toEqual(['cancelled'])
  })

  it('cannot cancel twice', () => {
    const book = fill(1, 3)
    const token = book.registrations[0].cancelToken
    const once = cancelInBook(book, token, ctx(3)).book
    expect(() => cancelInBook(once, token, ctx(3))).toThrowError(/not_cancellable/)
  })

  it('lets someone whose offer expired register again', () => {
    let book = fill(4, 3)
    book = cancelInBook(book, book.registrations[0].cancelToken, ctx(3)).book
    clock.advanceHours(25)
    book = resolveExpiredOffers(book, ctx(3)).book
    expect(() => registerInBook(book, person(4), ctx(3))).not.toThrow()
  })
})
