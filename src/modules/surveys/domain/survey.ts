import { DomainError } from '../../../shared/errors'

export interface SurveyResponse {
  /** Equals the registration id: one answer per registration by construction. */
  id: string
  activityId: string
  rating: number
  comment: string
  createdAt: string
  version: number
}

export interface SurveyAnswerInput {
  registrationId: string
  activityId: string
  rating: number
  comment: string
}

export const MAX_COMMENT_LENGTH = 500

export function createSurveyResponse(input: SurveyAnswerInput, now: Date): SurveyResponse {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new DomainError('rating_invalid')
  }
  const comment = input.comment.trim()
  if (comment.length > MAX_COMMENT_LENGTH) throw new DomainError('comment_too_long')
  return {
    id: input.registrationId,
    activityId: input.activityId,
    rating: input.rating,
    comment,
    createdAt: now.toISOString(),
    version: 0,
  }
}

export interface SurveySummary {
  count: number
  average: number | null
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  comments: string[]
}

export function summarize(responses: SurveyResponse[]): SurveySummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of responses) distribution[r.rating as 1 | 2 | 3 | 4 | 5]++
  const total = responses.reduce((sum, r) => sum + r.rating, 0)
  return {
    count: responses.length,
    average: responses.length ? total / responses.length : null,
    distribution,
    comments: responses.map((r) => r.comment).filter(Boolean),
  }
}
