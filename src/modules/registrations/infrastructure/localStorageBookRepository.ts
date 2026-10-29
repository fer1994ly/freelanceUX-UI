import { ConcurrencyError } from '../../../shared/errors'
import { readJson, writeJson } from '../../../shared/storage'
import type { RegistrationBookRepository, TokenKind } from '../application/ports'
import type { RegistrationBook } from '../domain/registration'

export const BOOK_PREFIX = 'er.book.'

const TOKEN_FIELD = {
  cancel: 'cancelToken',
  offer: 'offerToken',
  checkIn: 'checkInToken',
  survey: 'surveyToken',
} as const

/** One localStorage key per activity; the whole book is the unit of optimistic locking. */
export class LocalStorageBookRepository implements RegistrationBookRepository {
  async get(activityId: string): Promise<RegistrationBook> {
    return this.read(activityId)
  }

  private read(activityId: string): RegistrationBook {
    return readJson<RegistrationBook>(BOOK_PREFIX + activityId, { id: activityId, registrations: [], version: 0 })
  }

  async save(book: RegistrationBook): Promise<RegistrationBook> {
    // Check and write must happen in one synchronous step (no await in between).
    const stored = this.read(book.id)
    if (stored.version !== book.version) throw new ConcurrencyError()
    const saved = { ...book, version: book.version + 1 }
    writeJson(BOOK_PREFIX + book.id, saved)
    return saved
  }

  async listActivityIds(): Promise<string[]> {
    const ids: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(BOOK_PREFIX)) ids.push(key.slice(BOOK_PREFIX.length))
    }
    return ids
  }

  async findActivityIdByToken(kind: TokenKind, token: string): Promise<string | undefined> {
    if (!token) return undefined
    for (const id of await this.listActivityIds()) {
      const book = await this.get(id)
      if (book.registrations.some((r) => r[TOKEN_FIELD[kind]] === token)) return id
    }
    return undefined
  }
}
