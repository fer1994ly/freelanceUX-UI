import { VersionedCollection } from '../../../shared/collection'
import type { SurveyRepository } from '../application/ports'
import type { SurveyResponse } from '../domain/survey'

export const SURVEYS_KEY = 'er.surveys'

export class LocalStorageSurveyRepository implements SurveyRepository {
  private readonly col = new VersionedCollection<SurveyResponse>(SURVEYS_KEY)
  async listByActivity(activityId: string) {
    return this.col.list().filter((r) => r.activityId === activityId)
  }
  async get(registrationId: string) {
    return this.col.get(registrationId)
  }
  async save(response: SurveyResponse) {
    return this.col.save(response)
  }
}
