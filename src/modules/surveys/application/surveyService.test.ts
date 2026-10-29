import { describe, expect, it } from 'vitest'
import { makeHarness, person } from '../../registrations/application/testHarness'
import { LocalStorageSurveyRepository } from '../infrastructure/localStorageSurveyRepository'
import { SurveyService } from './surveyService'

const setup = async () => {
  const h = makeHarness()
  const a = await h.createActivity(2)
  const svc = new SurveyService(new LocalStorageSurveyRepository(), h.registrations, h.clock)
  const { registration } = await h.registrations.register(a.id, person(1))
  return { h, a, svc, token: registration.surveyToken }
}

describe('SurveyService', () => {
  it('is closed before the activity date', async () => {
    const { svc, token } = await setup()
    expect((await svc.getForm(token))?.open).toBe(false)
    await expect(svc.submit(token, { rating: 5, comment: '' })).rejects.toThrow(/survey_not_open/)
  })

  it('accepts one answer per registration after the date', async () => {
    const { h, svc, token, a } = await setup()
    h.clock.set('2026-12-02T10:00:00.000Z')
    await svc.submit(token, { rating: 5, comment: 'Excelente' })
    await expect(svc.submit(token, { rating: 1, comment: '' })).rejects.toThrow(/already_answered/)
    expect((await svc.getForm(token))?.answered).toBe(true)
    const res = await svc.results(a.id)
    expect(res).toMatchObject({ count: 1, average: 5, comments: ['Excelente'] })
  })

  it('concurrent duplicate submissions store a single answer', async () => {
    const { h, svc, token, a } = await setup()
    h.clock.set('2026-12-02T10:00:00.000Z')
    const out = await Promise.allSettled([
      svc.submit(token, { rating: 4, comment: '' }),
      svc.submit(token, { rating: 2, comment: '' }),
    ])
    expect(out.filter((o) => o.status === 'fulfilled')).toHaveLength(1)
    expect((await svc.results(a.id)).count).toBe(1)
  })

  it('rejects unknown tokens and non-confirmed registrations', async () => {
    const { h, svc, a } = await setup()
    const w = await h.registrations.register(a.id, person(2))
    const x = await h.registrations.register(a.id, person(3))
    h.clock.set('2026-12-02T10:00:00.000Z')
    await expect(svc.submit('nope', { rating: 3, comment: '' })).rejects.toThrow(/survey_not_found/)
    await expect(svc.submit(x.registration.surveyToken, { rating: 3, comment: '' })).rejects.toThrow(/not_confirmed/)
    expect(w.registration.status).toBe('confirmed')
  })
})
