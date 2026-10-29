import { describe, expect, it } from 'vitest'
import { FakeClock } from '../shared/testing/fakeClock'
import { createContainer } from './container'
import { resetDemoData, seedDemoData } from './seed'

describe('demo seed', () => {
  const make = () => createContainer({ clock: new FakeClock('2026-11-01T10:00:00.000Z') })

  it('seeds once, with one nearly full activity and an empty outbox', async () => {
    const c = make()
    expect(await seedDemoData(c)).toBe(true)
    expect(await seedDemoData(c)).toBe(false)
    const list = await c.activities.listUpcoming()
    expect(list).toHaveLength(3)
    expect(await c.registrations.occupiedSeats(list[0].id)).toBe(5)
    expect(list[0].capacity).toBe(6)
    expect(c.outbox.list()).toHaveLength(0)
  })

  it('reset wipes registrations and reseeds', async () => {
    const c = make()
    await seedDemoData(c)
    const first = (await c.activities.listUpcoming())[0]
    await c.registrations.register(first.id, { name: 'Zoe', email: 'z@x.com', phone: '2235550000', consent: true })
    await resetDemoData(c)
    const again = (await c.activities.listUpcoming())[0]
    expect(await c.registrations.occupiedSeats(again.id)).toBe(5)
  })
})
