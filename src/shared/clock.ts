export interface Clock {
  now(): Date
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

export const HOUR_MS = 60 * 60 * 1000
