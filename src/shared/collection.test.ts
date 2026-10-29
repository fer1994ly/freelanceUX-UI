import { describe, expect, it } from 'vitest'
import { VersionedCollection } from './collection'
import { ConcurrencyError } from './errors'

type Item = { id: string; name: string; version: number }

describe('VersionedCollection', () => {
  const make = () => new VersionedCollection<Item>('test.items')

  it('assigns versions and persists', () => {
    const c = make()
    const saved = c.save({ id: 'a', name: 'x', version: 0 })
    expect(saved.version).toBe(1)
    expect(make().get('a')).toEqual(saved)
    expect(make().list()).toHaveLength(1)
  })

  it('rejects stale writes with ConcurrencyError', () => {
    const c = make()
    const v1 = c.save({ id: 'a', name: 'x', version: 0 })
    c.save({ ...v1, name: 'y' })
    expect(() => c.save({ ...v1, name: 'z' })).toThrow(ConcurrencyError)
  })

  it('rejects creating an id that already exists', () => {
    const c = make()
    c.save({ id: 'a', name: 'x', version: 0 })
    expect(() => c.save({ id: 'a', name: 'dup', version: 0 })).toThrow(ConcurrencyError)
  })
})
