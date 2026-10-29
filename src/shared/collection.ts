import { ConcurrencyError } from './errors'
import { readJson, writeJson } from './storage'

export interface Versioned {
  id: string
  version: number
}

/**
 * localStorage-backed collection with optimistic versioning.
 * Save succeeds only when the incoming version equals the stored one
 * (0 for new entities); the stored version is then incremented.
 */
export class VersionedCollection<T extends Versioned> {
  constructor(private readonly key: string) {}

  list(): T[] {
    return readJson<T[]>(this.key, [])
  }

  get(id: string): T | undefined {
    return this.list().find((x) => x.id === id)
  }

  save(entity: T): T {
    const all = this.list()
    const idx = all.findIndex((x) => x.id === entity.id)
    const storedVersion = idx === -1 ? 0 : all[idx].version
    if (storedVersion !== entity.version || (idx !== -1 && entity.version === 0)) {
      throw new ConcurrencyError()
    }
    const saved = { ...entity, version: entity.version + 1 }
    if (idx === -1) all.push(saved)
    else all[idx] = saved
    writeJson(this.key, all)
    return saved
  }

  clear(): void {
    localStorage.removeItem(this.key)
  }
}
