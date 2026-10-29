import { describe, expect, it } from 'vitest'
import { createSurveyResponse, summarize } from './survey'

const now = new Date('2026-12-02T10:00:00.000Z')

describe('survey domain', () => {
  it('creates a response keyed by registration id', () => {
    const r = createSurveyResponse({ registrationId: 'r1', activityId: 'a', rating: 4, comment: ' ok ' }, now)
    expect(r).toMatchObject({ id: 'r1', rating: 4, comment: 'ok', version: 0 })
  })
  it.each([0, 6, 2.5, NaN])('rejects rating %s', (rating) => {
    expect(() => createSurveyResponse({ registrationId: 'r', activityId: 'a', rating, comment: '' }, now)).toThrow()
  })
  it('rejects over-long comments', () => {
    expect(() =>
      createSurveyResponse({ registrationId: 'r', activityId: 'a', rating: 5, comment: 'x'.repeat(501) }, now),
    ).toThrow()
  })
  it('summarizes count, average, distribution and non-empty comments', () => {
    const mk = (id: string, rating: number, comment = '') =>
      createSurveyResponse({ registrationId: id, activityId: 'a', rating, comment }, now)
    const s = summarize([mk('1', 5, 'genial'), mk('2', 3), mk('3', 4)])
    expect(s.count).toBe(3)
    expect(s.average).toBe(4)
    expect(s.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 })
    expect(s.comments).toEqual(['genial'])
    expect(summarize([]).average).toBeNull()
  })
})
