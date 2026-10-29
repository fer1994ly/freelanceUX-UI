import { DomainError } from '../../../shared/errors'
import type { ActivityService } from '../../activities/application/activityService'
import type { RegistrationService } from '../../registrations/application/registrationService'
import { buildAttendanceCsv } from '../domain/csv'

const slug = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export class ReportService {
  constructor(
    private readonly activities: Pick<ActivityService, 'get'>,
    private readonly registrations: Pick<RegistrationService, 'listForActivity'>,
  ) {}

  async exportCsv(activityId: string): Promise<{ filename: string; content: string }> {
    const activity = await this.activities.get(activityId)
    if (!activity) throw new DomainError('activity_not_found')
    const list = await this.registrations.listForActivity(activityId)
    const date = activity.startsAt?.slice(0, 10) ?? 'sin-fecha'
    return { filename: `${slug(activity.title)}-${date}.csv`, content: buildAttendanceCsv(list) }
  }
}
