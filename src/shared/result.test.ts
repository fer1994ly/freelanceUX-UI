import { describe, expect, it } from 'vitest'
import { err, isErr, isOk, ok } from './result'

describe('Result', () => {
  it('wraps success and failure', () => {
    const good = ok(1)
    const bad = err('boom')
    expect(isOk(good) && good.value).toBe(1)
    expect(isErr(bad) && bad.error).toBe('boom')
    expect(isOk(bad)).toBe(false)
  })
})
