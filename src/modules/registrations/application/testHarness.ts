import { FakeClock } from '../../../shared/testing/fakeClock'
import { SequentialIds } from '../../../shared/testing/sequentialIds'
import { InMemoryLockManager, type LockManager } from '../../../shared/lock'
import { ActivityService } from '../../activities/application/activityService'
import { LocalStorageActivityRepository } from '../../activities/infrastructure/localStorageActivityRepository'
import { LocalStorageBookRepository } from '../infrastructure/localStorageBookRepository'
import { LocalStorageOutbox } from '../infrastructure/localStorageOutbox'
import { RegistrationService } from './registrationService'
import type { ErrorReporter, Notifier } from './ports'

/** Test-only wiring of the registrations slice with in-process adapters. */
export function makeHarness(opts: {
    capacity?: number
    locks?: LockManager
    /** Wraps the outbox, e.g. to inject delivery failures. */
    wrapNotifier?: (outbox: Notifier) => Notifier
    reporter?: ErrorReporter
  } = {}) {
  const clock = new FakeClock('2026-11-01T10:00:00.000Z')
  const ids = new SequentialIds()
  const activities = new ActivityService(new LocalStorageActivityRepository(), ids, clock)
  const outbox = new LocalStorageOutbox(clock, ids)
  const registrations = new RegistrationService({
    books: new LocalStorageBookRepository(),
    activities: new LocalStorageActivityRepository(),
    locks: opts.locks ?? new InMemoryLockManager(),
    notifier: opts.wrapNotifier ? opts.wrapNotifier(outbox) : outbox,
    reporter: opts.reporter,
    clock,
    ids,
  })
  const createActivity = (capacity = opts.capacity ?? 1) =>
    activities.create({
      title: 'Taller de prueba',
      description: '',
      startsAt: '2026-12-01T15:00:00.000Z',
      location: 'Mar del Plata',
      capacity,
      priceArs: 0,
    })
  return { clock, ids, activities, registrations, outbox, createActivity }
}

export const person = (n: number) => ({
  name: `Person ${n}`,
  email: `p${n}@example.com`,
  phone: '+54 223 555 0000',
  consent: true,
})
