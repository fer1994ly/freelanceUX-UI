import type { SurveyResponse } from '../domain/survey'

export interface SurveyRepository {
  listByActivity(activityId: string): Promise<SurveyResponse[]>
  get(registrationId: string): Promise<SurveyResponse | undefined>
  /** Throws ConcurrencyError when the registration already has an answer. */
  save(response: SurveyResponse): Promise<SurveyResponse>
}
