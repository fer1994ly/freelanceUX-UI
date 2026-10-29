import { describe, expect, it } from 'vitest'
import { InMemoryLockManager } from './lock'

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
