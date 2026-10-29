import type { Clock } from '../../../shared/clock'
import { DomainError } from '../../../shared/errors'
import type { LockManager } from '../../../shared/lock'
import { retryOnConflict } from '../../../shared/retry'
import type { RegistrationBookRepository } from '../../registrations/application/ports'
import type { Registration, RegistrationBook } from '../../registrations/domain/registration'
import { checkInByToken, toggleCheckIn, type AttendanceChange } from '../domain/attendance'

export class AttendanceService {
  constructor(
    private readonly books: RegistrationBookRepository,
    private readonly locks: LockManager,
    private readonly clock: Clock,
  ) {}

  /** Check-in from a scanned or typed QR token. */
  async checkIn(token: string): Promise<Registration> {
    const activityId = await this.books.findActivityIdByToken('checkIn', token)
    if (!activityId) throw new DomainError('token_not_found')
    return this.apply(activityId, (book) => checkInByToken(book, token, this.clock.now()))
  }

  toggle(activityId: string, registrationId: string): Promise<Registration> {
    return this.apply(activityId, (book) => toggleCheckIn(book, registrationId, this.clock.now()))
  }

  private apply(activityId: string, change: (b: RegistrationBook) => AttendanceChange): Promise<Registration> {
    return this.locks.withLock(`activity:${activityId}`, () =>
      retryOnConflict(async () => {
        const out = change(await this.books.get(activityId))
        await this.books.save(out.book)
        return out.registration
      }),
    )
  }
}
