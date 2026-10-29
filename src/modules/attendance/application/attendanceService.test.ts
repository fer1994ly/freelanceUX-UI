import { describe, expect, it } from 'vitest'
import { makeHarness, person } from '../../registrations/application/testHarness'
import { LocalStorageBookRepository } from '../../registrations/infrastructure/localStorageBookRepository'
import { InMemoryLockManager } from '../../../shared/lock'
import { AttendanceService } from './attendanceService'

const setup = async () => {
  const h = makeHarness()
  const a = await h.createActivity(2)
  const svc = new AttendanceService(new LocalStorageBookRepository(), new InMemoryLockManager(), h.clock)
  return { h, a, svc }
}

describe('AttendanceService', () => {
  it('first scan succeeds, second is rejected as already checked in', async () => {
    const { h, a, svc } = await setup()
    const { registration } = await h.registrations.register(a.id, person(1))
    const ok = await svc.checkIn(registration.checkInToken)
    expect(ok.checkedInAt).not.toBeNull()
    await expect(svc.checkIn(registration.checkInToken)).rejects.toThrow(/already_checked_in/)
  })

  it('two simultaneous scans of one token yield exactly one success', async () => {
    const { h, a, svc } = await setup()
    const { registration } = await h.registrations.register(a.id, person(1))
    const results = await Promise.allSettled([
      svc.checkIn(registration.checkInToken),
      svc.checkIn(registration.checkInToken),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
  })

  it('unknown token and waitlisted people are rejected', async () => {
    const { h, a, svc } = await setup()
    await h.registrations.register(a.id, person(1))
    await h.registrations.register(a.id, person(2))
    const third = await h.registrations.register(a.id, person(3))
    await expect(svc.checkIn('bogus')).rejects.toThrow(/token_not_found/)
    await expect(svc.checkIn(third.registration.checkInToken)).rejects.toThrow(/not_confirmed/)
  })

  it('manual toggle by registration id', async () => {
    const { h, a, svc } = await setup()
    const { registration } = await h.registrations.register(a.id, person(1))
    expect((await svc.toggle(a.id, registration.id)).checkedInAt).not.toBeNull()
    expect((await svc.toggle(a.id, registration.id)).checkedInAt).toBeNull()
  })
})
