import type { Clock } from '../clock'

export class FakeClock implements Clock {
  private current: number
  constructor(iso: string) {
    this.current = new Date(iso).getTime()
  }
  now(): Date {
    return new Date(this.current)
  }
  advanceHours(hours: number): void {
    this.current += hours * 3_600_000
  }
  set(iso: string): void {
    this.current = new Date(iso).getTime()
  }
}
