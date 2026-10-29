import { VersionedCollection } from '../../../shared/collection'
import type { Activity } from '../domain/activity'
import type { ActivityRepository } from '../application/ports'

export const ACTIVITIES_KEY = 'er.activities'

export class LocalStorageActivityRepository implements ActivityRepository {
  private readonly col = new VersionedCollection<Activity>(ACTIVITIES_KEY)
  async list() {
    return this.col.list()
  }
  async get(id: string) {
    return this.col.get(id)
  }
  async save(activity: Activity) {
    return this.col.save(activity)
  }
}
