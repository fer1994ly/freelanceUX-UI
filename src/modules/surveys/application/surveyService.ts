import type { Clock } from '../../../shared/clock'
import { ConcurrencyError, DomainError } from '../../../shared/errors'
import type { Activity } from '../../activities/domain/activity'
import type { RegistrationService, RegistrationView } from '../../registrations/application/registrationService'
import { createSurveyResponse, summarize, type SurveySummary } from '../domain/survey'
import type { SurveyRepository } from './ports'

export interface SurveyForm {
  activity: Activity
  open: boolean
  answered: boolean
}

export class SurveyService {
  constructor(
    private readonly repo: SurveyRepository,
    private readonly registrations: Pick<RegistrationService, 'findByToken'>,
    private readonly clock: Clock,
  ) {}

  async getForm(token: string): Promise<SurveyForm | undefined> {
    const view = await this.registrations.findByToken('survey', token)
    if (!view) return undefined
    return {
      activity: view.activity,
      open: this.isOpen(view) && view.registration.status === 'confirmed',
      answered: (await this.repo.get(view.registration.id)) !== undefined,
    }
  }

  async submit(token: string, answer: { rating: number; comment: string }): Promise<void> {
    const view = await this.registrations.findByToken('survey', token)
    if (!view) throw new DomainError('survey_not_found')
    if (view.registration.status !== 'confirmed') throw new DomainError('not_confirmed')
    if (!this.isOpen(view)) throw new DomainError('survey_not_open')
    if (await this.repo.get(view.registration.id)) throw new DomainError('already_answered')
    const response = createSurveyResponse(
      { registrationId: view.registration.id, activityId: view.activity.id, ...answer },
      this.clock.now(),
    )
    try {
      await this.repo.save(response)
    } catch (e) {
      if (e instanceof ConcurrencyError) throw new DomainError('already_answered')
      throw e
    }
  }

  async results(activityId: string): Promise<SurveySummary> {
    return summarize(await this.repo.listByActivity(activityId))
  }

  /** The survey opens when the activity date has been reached. */
  private isOpen(view: RegistrationView): boolean {
    const startsAt = view.activity.startsAt
    return startsAt !== null && Date.parse(startsAt) <= this.clock.now().getTime()
  }
}
