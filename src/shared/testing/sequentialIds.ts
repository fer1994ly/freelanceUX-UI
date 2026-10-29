import type { IdGenerator } from '../ids'

export class SequentialIds implements IdGenerator {
  private n = 0
  private t = 0
  id(): string {
    return `id-${++this.n}`
  }
  token(): string {
    return `tok-${++this.t}`
  }
}
