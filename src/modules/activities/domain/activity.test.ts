import { describe, expect, it } from 'vitest'
import { createActivity, duplicateActivity, isUpcoming, type Activity } from './activity'

const base = {
  title: 'Taller de Figma',
  description: 'Introduccion',
  startsAt: '2026-12-01T15:00:00.000Z',
  location: 'Mar del Plata',
  capacity: 10,
  priceArs: 15000,
}

describe('createActivity', () => {
  it('creates a published activity at version 0', () => {
    const a = createActivity('a1', base)
    expect(a).toMatchObject({ id: 'a1', status: 'published', version: 0, capacity: 10 })
  })
  it.each([
    ['empty title', { title: '  ' }],
    ['zero capacity', { capacity: 0 }],
    ['fractional capacity', { capacity: 2.5 }],
    ['negative price', { priceArs: -1 }],
    ['invalid date', { startsAt: 'nope' }],
  ])('rejects %s', (_n, patch) => {
    expect(() => createActivity('a1', { ...base, ...patch })).toThrow()
  })
})

describe('isUpcoming', () => {
  const now = new Date('2026-11-01T00:00:00.000Z')
  const a = (patch: Partial<Activity>) => ({ ...createActivity('x', base), ...patch })
  it('is true for future published activities', () => expect(isUpcoming(a({}), now)).toBe(true))
  it('is false for past ones', () =>
    expect(isUpcoming(a({ startsAt: '2026-10-01T00:00:00.000Z' }), now)).toBe(false))
  it('is false without date, or when cancelled/draft', () => {
    expect(isUpcoming(a({ startsAt: null }), now)).toBe(false)
    expect(isUpcoming(a({ status: 'cancelled' }), now)).toBe(false)
    expect(isUpcoming(a({ status: 'draft' }), now)).toBe(false)
  })
})

describe('duplicateActivity', () => {
  it('copies everything except id, date and version', () => {
    const src = { ...createActivity('a1', base), version: 4 }
    const copy = duplicateActivity(src, 'a2')
    expect(copy).toEqual({ ...src, id: 'a2', startsAt: null, version: 0 })
  })
})
