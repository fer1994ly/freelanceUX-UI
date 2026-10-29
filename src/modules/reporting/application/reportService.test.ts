import { describe, expect, it } from 'vitest'
import { makeHarness, person } from '../../registrations/application/testHarness'
import { ReportService } from './reportService'

describe('ReportService', () => {
  it('exports registrants, waitlist and attendance for an activity', async () => {
    const h = makeHarness()
    const a = await h.createActivity(1)
    await h.registrations.register(a.id, person(1))
    await h.registrations.register(a.id, person(2))
    const svc = new ReportService(h.activities, h.registrations)
    const { filename, content } = await svc.exportCsv(a.id)
    expect(filename).toBe('taller-de-prueba-2026-12-01.csv')
    expect(content).toContain('registrants,confirmed')
    expect(content).toContain('waitlist,waitlisted')
  })

  it('fails for an unknown activity', async () => {
    const h = makeHarness()
    await expect(new ReportService(h.activities, h.registrations).exportCsv('x')).rejects.toThrow()
  })
})
