import { ConcurrencyError } from './errors'

/** Runs `fn`; on a ConcurrencyError runs it once more (it must re-read its state). */
export async function retryOnConflict<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ConcurrencyError) return fn()
    throw e
  }
}
