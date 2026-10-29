import { SystemClock, type Clock } from '../shared/clock'
import { CryptoIdGenerator, type IdGenerator } from '../shared/ids'
import { BrowserLockManager, type LockManager } from '../shared/lock'
import { ActivityService } from '../modules/activities/application/activityService'
import { LocalStorageActivityRepository } from '../modules/activities/infrastructure/localStorageActivityRepository'
import { RegistrationService } from '../modules/registrations/application/registrationService'
import { LocalStorageBookRepository } from '../modules/registrations/infrastructure/localStorageBookRepository'
import { LocalStorageOutbox } from '../modules/registrations/infrastructure/localStorageOutbox'
import { AttendanceService } from '../modules/attendance/application/attendanceService'
import { SurveyService } from '../modules/surveys/application/surveyService'
import { LocalStorageSurveyRepository } from '../modules/surveys/infrastructure/localStorageSurveyRepository'
import { ReportService } from '../modules/reporting/application/reportService'

export interface ContainerOptions {
  clock?: Clock
  ids?: IdGenerator
  locks?: LockManager
  adminPin?: string
}

/** Composition root: the only place that binds ports to browser adapters. */
export function createContainer(opts: ContainerOptions = {}) {
  const clock = opts.clock ?? new SystemClock()
  const ids = opts.ids ?? new CryptoIdGenerator()
  const locks = opts.locks ?? new BrowserLockManager()
  const activityRepo = new LocalStorageActivityRepository()
  const books = new LocalStorageBookRepository()
  const outbox = new LocalStorageOutbox(clock, ids)

  const activities = new ActivityService(activityRepo, ids, clock)
  const registrations = new RegistrationService({
    books, activities: activityRepo, locks, notifier: outbox, clock, ids,
  })
  return {
    clock,
    activities,
    registrations,
    attendance: new AttendanceService(books, locks, clock),
    surveys: new SurveyService(new LocalStorageSurveyRepository(), registrations, clock),
    reports: new ReportService(activities, registrations),
    outbox,
    adminPin: opts.adminPin ?? import.meta.env.VITE_ADMIN_PIN ?? '1234',
  }
}

export type Container = ReturnType<typeof createContainer>
