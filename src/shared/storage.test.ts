import { describe, expect, it } from 'vitest'
import { readJson, writeJson } from './storage'

describe('storage helpers', () => {
  it('returns fallback for missing or corrupt values', () => {
    expect(readJson('missing', [1])).toEqual([1])
    localStorage.setItem('bad', '{not json')
    expect(readJson('bad', 7)).toBe(7)
  })
  it('round-trips JSON', () => {
    writeJson('k', { a: 1 })
    expect(readJson('k', null)).toEqual({ a: 1 })
  })
})
