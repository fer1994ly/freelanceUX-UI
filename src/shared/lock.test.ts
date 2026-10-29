import { describe, expect, it, vi } from 'vitest'
import { BrowserLockManager, InMemoryLockManager } from './lock'

describe('InMemoryLockManager', () => {
  it('serializes critical sections for the same key', async () => {
    const locks = new InMemoryLockManager()
    const trace: string[] = []
    const run = (name: string) =>
      locks.withLock('k', async () => {
        trace.push(`${name}:start`)
        await new Promise((r) => setTimeout(r, 5))
        trace.push(`${name}:end`)
      })
    await Promise.all([run('a'), run('b'), run('c')])
    expect(trace).toEqual(['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end'])
  })

  it('does not block different keys and releases after errors', async () => {
    const locks = new InMemoryLockManager()
    await expect(locks.withLock('k', async () => { throw new Error('x') })).rejects.toThrow('x')
    await expect(locks.withLock('k', async () => 5)).resolves.toBe(5)
  })
})

describe('BrowserLockManager', () => {
  it('uses navigator.locks exclusively when available', async () => {
    const request = vi.fn((_n: string, _o: unknown, fn: () => Promise<unknown>) => fn())
    vi.stubGlobal('navigator', { locks: { request } })
    await expect(new BrowserLockManager().withLock('act-1', async () => 'ok')).resolves.toBe('ok')
    expect(request).toHaveBeenCalledWith('er:act-1', { mode: 'exclusive' }, expect.any(Function))
    vi.unstubAllGlobals()
  })

  it('falls back to the in-memory mutex without navigator.locks', async () => {
    vi.stubGlobal('navigator', {})
    await expect(new BrowserLockManager().withLock('k', async () => 3)).resolves.toBe(3)
    vi.unstubAllGlobals()
  })
})
