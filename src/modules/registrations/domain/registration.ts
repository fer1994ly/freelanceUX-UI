export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'offered' | 'cancelled' | 'expired'

export interface Registration {
  id: string
  activityId: string
  name: string
  email: string
  phone: string
  consent: true
  status: RegistrationStatus
  createdAt: string
  /** Opaque value encoded in the QR code. */
  checkInToken: string
  /** Secret for the public `/cancel/:token` page. */
  cancelToken: string
  /** Secret for `/offer/:token`; only set while status is `offered`. */
  offerToken: string | null
  offerExpiresAt: string | null
  /** Secret for `/survey/:token`. */
  surveyToken: string
  checkedInAt: string | null
}

/** Aggregate: every registration of one activity, guarded by one version. */
export interface RegistrationBook {
  /** Equals the activity id. */
  id: string
  registrations: Registration[]
  version: number
}

export type RegistrationEvent =
  | { type: 'confirmed'; registrationId: string }
  | { type: 'waitlisted'; registrationId: string }
  | { type: 'offered'; registrationId: string }
  | { type: 'cancelled'; registrationId: string }

export const OFFER_WINDOW_HOURS = 24
