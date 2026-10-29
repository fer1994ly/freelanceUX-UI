export interface LockManager {
  /** Runs `fn` while holding an exclusive lock on `key`. */
  withLock<T>(key: string, fn: () => Promise<T>): Promise<T>
}

/** Promise-chain mutex per key. Same-process only. */
export class InMemoryLockManager implements LockManager {
  private tails = new Map<string, Promise<unknown>>()

  withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve()
    const run = previous.then(fn, fn)
    const tail = run.catch(() => undefined)
    this.tails.set(key, tail)
    void tail.then(() => {
      if (this.tails.get(key) === tail) this.tails.delete(key)
    })
    return run
  }
}

/**
 * Cross-tab exclusive lock via the Web Locks API, falling back to an
 * in-memory mutex when `navigator.locks` is unavailable.
 */
export class BrowserLockManager implements LockManager {
  constructor(private readonly fallback: LockManager = new InMemoryLockManager()) {}

  withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
    if (!locks?.request) return this.fallback.withLock(key, fn)
    return locks.request(`er:${key}`, { mode: 'exclusive' }, fn) as Promise<T>
  }
}
