import type { Clock } from '../../../shared/clock'
import type { IdGenerator } from '../../../shared/ids'
import { DomainError } from '../../../shared/errors'
import {
  createActivity,
  duplicateActivity,
  isUpcoming,
  validateActivityFields,
  type Activity,
  type ActivityInput,
} from '../domain/activity'
import type { ActivityRepository } from './ports'

const byDate = (a: Activity, b: Activity) =>
  (a.startsAt ?? '9999').localeCompare(b.startsAt ?? '9999')

export class ActivityService {
  constructor(
    private readonly repo: ActivityRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  create(input: ActivityInput): Promise<Activity> {
    return this.repo.save(createActivity(this.ids.id(), input))
  }

  get(id: string): Promise<Activity | undefined> {
    return this.repo.get(id)
  }

  async listAll(): Promise<Activity[]> {
    return (await this.repo.list()).sort(byDate)
  }

  async listUpcoming(): Promise<Activity[]> {
    const now = this.clock.now()
    return (await this.repo.list()).filter((a) => isUpcoming(a, now)).sort(byDate)
  }

  async update(id: string, patch: Partial<ActivityInput>): Promise<Activity> {
    const current = await this.require(id)
    const next = { ...current, ...patch }
    validateActivityFields(next)
    return this.repo.save(next)
  }

  async duplicate(id: string): Promise<Activity> {
    return this.repo.save(duplicateActivity(await this.require(id), this.ids.id()))
  }

  private async require(id: string): Promise<Activity> {
    const a = await this.repo.get(id)
    if (!a) throw new DomainError('activity_not_found')
    return a
  }
}
