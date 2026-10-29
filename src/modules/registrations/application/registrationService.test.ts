import { describe, expect, it } from 'vitest'
import { NoLockManager } from '../../../shared/lock'
import { makeHarness, person } from './testHarness'

describe('RegistrationService', () => {
  it('confirms, then waitlists with position, writing outbox messages', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    const first = await h.registrations.register(a.id, person(1))
    const second = await h.registrations.register(a.id, person(2))
    expect(first.registration.status).toBe('confirmed')
    expect(second.registration.status).toBe('waitlisted')
    expect(second.position).toBe(1)
    expect(h.outbox.list().map((m) => m.kind)).toEqual(['confirmation', 'waitlisted'])
  })

  it('rejects registering for an unknown activity or a duplicate email', async () => {
    const h = makeHarness()
    const a = await h.createActivity(3)
    await expect(h.registrations.register('nope', person(1))).rejects.toThrow()
    await h.registrations.register(a.id, person(1))
    await expect(h.registrations.register(a.id, person(1))).rejects.toThrow(/already_registered/)
  })

  it('last seat: concurrent registrations under the lock yield one confirmed and one waitlisted', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    const results = await Promise.all([
      h.registrations.register(a.id, person(1)),
      h.registrations.register(a.id, person(2)),
    ])
    expect(results.map((r) => r.registration.status).sort()).toEqual(['confirmed', 'waitlisted'])
    expect(await h.registrations.occupiedSeats(a.id)).toBe(1)
  })

  it('last seat: even without a lock, the optimistic version check + retry keeps the invariant', async () => {
    const h = makeHarness({ locks: new NoLockManager() })
    const a = await h.createActivity(1)
    const results = await Promise.all([
      h.registrations.register(a.id, person(1)),
      h.registrations.register(a.id, person(2)),
    ])
    expect(results.map((r) => r.registration.status).sort()).toEqual(['confirmed', 'waitlisted'])
  })

  it('many concurrent registrations never exceed capacity', async () => {
    const h = makeHarness()
    const a = await h.createActivity(3)
    const results = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7].map((n) => h.registrations.register(a.id, person(n))),
    )
    expect(results.filter((r) => r.registration.status === 'confirmed')).toHaveLength(3)
    expect(results.filter((r) => r.registration.status === 'waitlisted')).toHaveLength(4)
  })

  it('cancel promotes the first waitlisted with an offer and notifies both', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    const first = await h.registrations.register(a.id, person(1))
    await h.registrations.register(a.id, person(2))
    await h.registrations.register(a.id, person(3))
    await h.registrations.cancel(first.registration.cancelToken)
    const list = await h.registrations.listForActivity(a.id)
    expect(list.map((r) => r.status)).toEqual(['cancelled', 'offered', 'waitlisted'])
    expect(h.outbox.list().map((m) => m.kind)).toEqual([
      'confirmation', 'waitlisted', 'waitlisted', 'cancellation', 'seat-offered',
    ])
  })

  it('confirms an offer by token', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    const first = await h.registrations.register(a.id, person(1))
    await h.registrations.register(a.id, person(2))
    await h.registrations.cancel(first.registration.cancelToken)
    const offered = (await h.registrations.listForActivity(a.id))[1]
    const confirmed = await h.registrations.confirmOffer(offered.offerToken!)
    expect(confirmed.status).toBe('confirmed')
  })

  it('resolves expired offers lazily on read, cascading to the next in line', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    const first = await h.registrations.register(a.id, person(1))
    await h.registrations.register(a.id, person(2))
    await h.registrations.register(a.id, person(3))
    await h.registrations.cancel(first.registration.cancelToken)
    h.clock.advanceHours(25)
    const list = await h.registrations.listForActivity(a.id)
    expect(list.map((r) => r.status)).toEqual(['cancelled', 'expired', 'offered'])
    expect(h.outbox.list().filter((m) => m.kind === 'seat-offered')).toHaveLength(2)
  })

  it('looks up a registration by its cancel token with position', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    await h.registrations.register(a.id, person(1))
    const w = await h.registrations.register(a.id, person(2))
    const found = await h.registrations.findByCancelToken(w.registration.cancelToken)
    expect(found?.registration.id).toBe(w.registration.id)
    expect(found?.position).toBe(1)
    expect(found?.activity.id).toBe(a.id)
    expect(await h.registrations.findByCancelToken('missing')).toBeUndefined()
  })
})

describe('RegistrationService registration window', () => {
  it('refuses registrations for past or unpublished activities', async () => {
    const h = makeHarness()
    const a = await h.createActivity(2)
    h.clock.set('2026-12-02T00:00:00.000Z')
    await expect(h.registrations.register(a.id, person(1))).rejects.toThrow(/registration_closed/)
    h.clock.set('2026-11-01T10:00:00.000Z')
    await h.activities.update(a.id, { status: 'cancelled' })
    await expect(h.registrations.register(a.id, person(1))).rejects.toThrow(/registration_closed/)
  })
})
