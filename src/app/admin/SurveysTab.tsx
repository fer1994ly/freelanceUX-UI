import { useState } from 'react'
import { useApp } from '../../shared/ui/AppContext'
import { useAsync } from '../../shared/ui/useAsync'
import { ActivityPicker } from './ActivityPicker'

export function SurveysTab() {
  const app = useApp()
  const [picked, setPicked] = useState('')
  const { data } = useAsync(async () => {
    const activities = await app.activities.listAll()
    const activityId = picked || activities[0]?.id || ''
    return { activities, activityId, summary: activityId ? await app.surveys.results(activityId) : undefined }
  }, picked)

  if (!data) return <p>Cargando…</p>
  if (!data.summary) return <p className="notice">Todavía no hay actividades.</p>
  const { summary } = data
  return (
    <div className="stack">
      <ActivityPicker activities={data.activities} value={data.activityId} onChange={setPicked} />
      <p>
        Respuestas: <strong>{summary.count}</strong> · Promedio: <strong>{summary.average?.toFixed(1) ?? '—'}</strong>
      </p>
      <ul>
        {([5, 4, 3, 2, 1] as const).map((n) => (
          <li key={n}>{n} ★: {summary.distribution[n]}</li>
        ))}
      </ul>
      {summary.comments.length ? (
        <ul>{summary.comments.map((c, i) => <li key={i}>{c}</li>)}</ul>
      ) : (
        <p className="hint">Sin comentarios.</p>
      )}
    </div>
  )
}
