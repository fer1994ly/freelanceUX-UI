import type { Activity } from '../domain/activity'

export interface ActivityRepository {
  list(): Promise<Activity[]>
  get(id: string): Promise<Activity | undefined>
  save(activity: Activity): Promise<Activity>
}
