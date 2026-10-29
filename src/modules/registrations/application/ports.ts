import type { RegistrationBook } from '../domain/registration'

export type TokenKind = 'cancel' | 'offer' | 'checkIn' | 'survey'

export interface RegistrationBookRepository {
  /** Returns an empty version-0 book when the activity has no registrations yet. */
  get(activityId: string): Promise<RegistrationBook>
  /** Optimistic: throws ConcurrencyError when the stored version differs. */
  save(book: RegistrationBook): Promise<RegistrationBook>
  findActivityIdByToken(kind: TokenKind, token: string): Promise<string | undefined>
  listActivityIds(): Promise<string[]>
}

export type NotificationKind = 'confirmation' | 'waitlisted' | 'seat-offered' | 'cancellation'

export interface Notification {
  kind: NotificationKind
  to: string
  name: string
  subject: string
  body: string
  activityId: string
  registrationId: string
}

export interface OutboxMessage extends Notification {
  id: string
  createdAt: string
}

/** Port for outgoing messages. Real email (Kodarvia) will implement it later. */
export interface Notifier {
  notify(notification: Notification): Promise<void>
}
