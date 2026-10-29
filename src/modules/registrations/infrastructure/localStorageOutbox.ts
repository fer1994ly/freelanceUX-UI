import type { Clock } from '../../../shared/clock'
import type { IdGenerator } from '../../../shared/ids'
import { readJson, writeJson } from '../../../shared/storage'
import type { Notification, Notifier, OutboxMessage } from '../application/ports'

export const OUTBOX_KEY = 'er.outbox'

/** Notifier that only records messages; a real email adapter replaces it later. */
export class LocalStorageOutbox implements Notifier {
  constructor(
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async notify(n: Notification): Promise<void> {
    const all = this.list()
    all.push({ ...n, id: this.ids.id(), createdAt: this.clock.now().toISOString() })
    writeJson(OUTBOX_KEY, all)
  }

  list(): OutboxMessage[] {
    return readJson<OutboxMessage[]>(OUTBOX_KEY, [])
  }

  clear(): void {
    localStorage.removeItem(OUTBOX_KEY)
  }
}
