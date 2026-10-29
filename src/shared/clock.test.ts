import { describe, expect, it } from 'vitest'
import { FakeClock } from './testing/fakeClock'

describe('FakeClock', () => {
  it('advances on demand', () => {
    const c = new FakeClock('2026-01-01T00:00:00.000Z')
    c.advanceHours(25)
    expect(c.now().toISOString()).toBe('2026-01-02T01:00:00.000Z')
  })
})
