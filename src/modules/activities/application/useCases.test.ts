import { beforeEach, describe, expect, it } from 'vitest'
import { FakeClock } from '../../../shared/testing/fakeClock'
import { SequentialIds } from '../../../shared/testing/sequentialIds'
import { LocalStorageActivityRepository } from '../infrastructure/localStorageActivityRepository'
import { ActivityService } from './activityService'

const input = {
  title: 'Taller',
  description: 'd',
  startsAt: '2026-12-01T15:00:00.000Z',
  location: 'MdP',
  capacity: 5,
  priceArs: 0,
}

describe('ActivityService', () => {
  let svc: ActivityService
  beforeEach(() => {
    const clock = new FakeClock('2026-11-01T00:00:00.000Z')
    svc = new ActivityService(new LocalStorageActivityRepository(), new SequentialIds(), clock)
  })

  it('creates and fetches an activity', async () => {
    const a = await svc.create(input)
    expect((await svc.get(a.id))?.title).toBe('Taller')
  })

  it('lists only upcoming activities sorted by date', async () => {
    await svc.create({ ...input, title: 'later', startsAt: '2027-01-01T10:00:00.000Z' })
    await svc.create({ ...input, title: 'past', startsAt: '2026-10-01T10:00:00.000Z' })
    await svc.create({ ...input, title: 'sooner', startsAt: '2026-11-15T10:00:00.000Z' })
    expect((await svc.listUpcoming()).map((a) => a.title)).toEqual(['sooner', 'later'])
  })

  it('duplicates without date, and the copy is persisted', async () => {
    const a = await svc.create(input)
    const copy = await svc.duplicate(a.id)
    expect(copy.startsAt).toBeNull()
    expect(copy.id).not.toBe(a.id)
    expect(await svc.listAll()).toHaveLength(2)
  })

  it('a duplicate becomes upcoming once a date is set', async () => {
    const copy = await svc.duplicate((await svc.create(input)).id)
    expect(await svc.listUpcoming()).toHaveLength(1)
    const updated = await svc.update(copy.id, { startsAt: '2027-02-01T10:00:00.000Z' })
    expect(updated.startsAt).toBe('2027-02-01T10:00:00.000Z')
    expect(await svc.listUpcoming()).toHaveLength(2)
  })

  it('duplicate of unknown activity fails', async () => {
    await expect(svc.duplicate('nope')).rejects.toThrow()
  })
})
