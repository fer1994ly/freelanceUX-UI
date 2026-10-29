import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrowserLockManager, InMemoryLockManager, type LockManager } from './lock'

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

  it('a lock held on one key does not block another key', async () => {
    const locks = new InMemoryLockManager()
    let release: () => void = () => undefined
    const held = locks.withLock('a', () => new Promise<void>((r) => { release = r }))
    await expect(locks.withLock('b', async () => 'free')).resolves.toBe('free')
    release()
    await held
  })
})

describe('BrowserLockManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('delegates to navigator.locks with exclusive mode and the namespaced key', async () => {
    const request = vi.fn((_n: string, _o: unknown, fn: () => Promise<unknown>) => fn())
    vi.stubGlobal('navigator', { locks: { request } })
    const withLock = vi.fn()
    await expect(new BrowserLockManager({ withLock }).withLock('act-1', async () => 'ok')).resolves.toBe('ok')
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('er:act-1', { mode: 'exclusive' }, expect.any(Function))
    expect(withLock).not.toHaveBeenCalled()
  })

  it('falls back to the in-memory mutex without navigator.locks', async () => {
    vi.stubGlobal('navigator', {})
    const trace: string[] = []
    const locks = new BrowserLockManager()
    const run = (name: string) =>
      locks.withLock('k', async () => {
        trace.push(`${name}:start`)
        await new Promise((r) => setTimeout(r, 5))
        trace.push(`${name}:end`)
      })
    await Promise.all([run('a'), run('b')])
    expect(trace).toEqual(['a:start', 'a:end', 'b:start', 'b:end'])
  })

  it('uses the injected fallback when navigator.locks is missing', async () => {
    vi.stubGlobal('navigator', {})
    const withLock = vi.fn(async (_k: string, fn: () => Promise<unknown>) => fn())
    await new BrowserLockManager({ withLock: withLock as LockManager['withLock'] }).withLock('k', async () => 1)
    expect(withLock).toHaveBeenCalledWith('k', expect.any(Function))
  })

  it('a held lock on one key does not block another key', async () => {
    vi.stubGlobal('navigator', {})
    const locks = new BrowserLockManager()
    let release: () => void = () => undefined
    const held = locks.withLock('a', () => new Promise<void>((r) => { release = r }))
    await expect(locks.withLock('b', async () => 'free')).resolves.toBe('free')
    release()
    await held
  })
})
