import type { Clock } from '../../../shared/clock'
import { ConcurrencyError, DomainError } from '../../../shared/errors'
import type { IdGenerator } from '../../../shared/ids'
import type { LockManager } from '../../../shared/lock'
import { isUpcoming, type Activity } from '../../activities/domain/activity'
import type { ActivityRepository } from '../../activities/application/ports'
import {
  cancelInBook,
  confirmOfferInBook,
  occupiedSeats,
  registerInBook,
  resolveExpiredOffers,
  waitlistPosition,
  type BookChange,
  type BookContext,
  type RegistrantInput,
} from '../domain/book'
import type {
  Registration,
  RegistrationBook,
  RegistrationEvent,
} from '../domain/registration'
import { buildNotification } from './messages'
import type { ErrorReporter, Notifier, NotificationKind, RegistrationBookRepository, TokenKind } from './ports'

export interface RegistrationServiceDeps {
  books: RegistrationBookRepository
  activities: ActivityRepository
  locks: LockManager
  notifier: Notifier
  clock: Clock
  ids: IdGenerator
  /** Receives notification delivery failures. Defaults to console.error. */
  reporter?: ErrorReporter
}

export interface RegistrationView {
  registration: Registration
  activity: Activity
  position: number | null
}

type Step<T> = BookChange & { result: T }

const NOTIFY: Record<RegistrationEvent['type'], NotificationKind> = {
  confirmed: 'confirmation',
  waitlisted: 'waitlisted',
  offered: 'seat-offered',
  cancelled: 'cancellation',
}

export class RegistrationService {
  constructor(private readonly d: RegistrationServiceDeps) {}

  async register(
    activityId: string,
    input: RegistrantInput,
  ): Promise<{ registration: Registration; position: number | null }> {
    const activity = await this.d.activities.get(activityId)
    if (!activity) throw new DomainError('activity_not_found')
    if (!isUpcoming(activity, this.d.clock.now())) throw new DomainError('registration_closed')
    return this.mutate(activityId, (book, ctx) => {
      const out = registerInBook(book, input, ctx)
      return {
        ...out,
        result: { registration: out.registration, position: waitlistPosition(out.book, out.registration.id) },
      }
    })
  }

  async cancel(cancelToken: string): Promise<Registration> {
    const activityId = await this.requireActivityId('cancel', cancelToken)
    return this.mutate(activityId, (book, ctx) => {
      const out = cancelInBook(book, cancelToken, ctx)
      const registration = out.book.registrations.find((r) => r.cancelToken === cancelToken)!
      return { ...out, result: registration }
    })
  }

  async confirmOffer(offerToken: string): Promise<Registration> {
    const activityId = await this.requireActivityId('offer', offerToken, 'offer_invalid')
    await this.refresh(activityId) // persist lazy expiry/cascade even if the confirm below fails
    return this.mutate(activityId, (book, ctx) => {
      const out = confirmOfferInBook(book, offerToken, ctx)
      return { ...out, result: out.registration }
    })
  }

  /** All registrations of an activity, after lazily resolving expired offers. */
  async listForActivity(activityId: string): Promise<Registration[]> {
    return (await this.refresh(activityId)).registrations
  }

  async occupiedSeats(activityId: string): Promise<number> {
    return occupiedSeats(await this.refresh(activityId))
  }

  async findByToken(kind: TokenKind, token: string): Promise<RegistrationView | undefined> {
    const activityId = await this.d.books.findActivityIdByToken(kind, token)
    if (!activityId) return undefined
    const book = await this.refresh(activityId)
    const field = { cancel: 'cancelToken', offer: 'offerToken', checkIn: 'checkInToken', survey: 'surveyToken' } as const
    const registration = book.registrations.find((r) => r[field[kind]] === token)
    const activity = await this.d.activities.get(activityId)
    if (!registration || !activity) return undefined
    return { registration, activity, position: waitlistPosition(book, registration.id) }
  }

  findByCancelToken(token: string) {
    return this.findByToken('cancel', token)
  }

  private async requireActivityId(kind: TokenKind, token: string, code = 'registration_not_found') {
    const id = await this.d.books.findActivityIdByToken(kind, token)
    if (!id) throw new DomainError(code)
    return id
  }

  private async refresh(activityId: string): Promise<RegistrationBook> {
    return this.mutate(activityId, (book) => ({ book, events: [], result: book }))
  }

  /**
   * Runs `step` on the activity's book inside the activity lock. Expired offers are
   * resolved first (lazy expiry). A version conflict is retried once on a fresh read.
   */
  private async mutate<T>(
    activityId: string,
    step: (book: RegistrationBook, ctx: BookContext) => Step<T>,
  ): Promise<T> {
    const activity = await this.d.activities.get(activityId)
    if (!activity) throw new DomainError('activity_not_found')
    return this.d.locks.withLock(`activity:${activityId}`, async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const stored = await this.d.books.get(activityId)
          const ctx: BookContext = { capacity: activity.capacity, now: this.d.clock.now(), ids: this.d.ids }
          const resolved = resolveExpiredOffers(stored, ctx)
          const out = step(resolved.book, ctx)
          const changed = out.book !== stored
          const saved = changed ? await this.d.books.save(out.book) : stored
          const events = [...resolved.events, ...out.events]
          await this.publish(events, saved, activity)
          return out.result
        } catch (e) {
          if (e instanceof ConcurrencyError && attempt < 1) continue
          throw e
        }
      }
    })
  }

  /** Best-effort: the book is already saved, so a delivery failure is reported, never thrown. */
  private async publish(events: RegistrationEvent[], book: RegistrationBook, activity: Activity) {
    for (const e of events) {
      const r = book.registrations.find((x) => x.id === e.registrationId)
      if (!r) continue
      const position = waitlistPosition(book, r.id)
      try {
        await this.d.notifier.notify(buildNotification(NOTIFY[e.type], r, activity, position))
      } catch (error) {
        this.report(error, `notify:${e.type}:${r.id}`)
      }
    }
  }

  private report(error: unknown, context: string) {
    try {
      if (this.d.reporter) this.d.reporter.report(error, context)
      else console.error(`[registrations] ${context}`, error)
    } catch {
      // reporting must never break the use case
    }
  }
}
