import { useState } from 'react'
import { useApp } from '../../shared/ui/AppContext'
import { downloadText } from '../../shared/ui/download'
import { errorMessage } from '../../shared/ui/messages'
import { useAsync } from '../../shared/ui/useAsync'
import { ActivityPicker } from './ActivityPicker'

const STATUS = {
  confirmed: 'Confirmada',
  waitlisted: 'En lista de espera',
  offered: 'Lugar ofrecido',
  cancelled: 'Cancelada',
  expired: 'Oferta vencida',
} as const

export function RegistrantsTab() {
  const app = useApp()
  const [picked, setPicked] = useState('')
  const [error, setError] = useState('')
  const { data, reload } = useAsync(async () => {
    const activities = await app.activities.listAll()
    const activityId = picked || activities[0]?.id || ''
    const registrations = activityId ? await app.registrations.listForActivity(activityId) : []
    return { activities, activityId, registrations }
  }, picked)

  if (!data) return <p>Cargando…</p>
  if (!data.activityId) return <p className="notice">Todavía no hay actividades.</p>
  const { activities, activityId, registrations } = data

  async function run(action: () => Promise<unknown>) {
    try {
      setError('')
      await action()
      reload()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function exportCsv() {
    try {
      setError('')
      const { filename, content } = await app.reports.exportCsv(activityId)
      downloadText(filename, content)
    } catch {
      setError('No se pudo exportar el CSV. Intenta de nuevo.')
    }
  }

  return (
    <div className="stack">
      <ActivityPicker activities={activities} value={activityId} onChange={setPicked} />
      <div className="row">
        <button className="btn" onClick={exportCsv}>Exportar CSV</button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Ingreso</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td>{STATUS[r.status]}</td>
                <td>{r.checkedInAt ? 'Presente' : '—'}</td>
                <td><div className="row">
                  {r.status === 'confirmed' ? (
                    <button className="btn small" onClick={() => run(() => app.attendance.toggle(activityId, r.id))}>
                      {r.checkedInAt ? 'Quitar ingreso' : 'Marcar ingreso'}
                      <span className="sr-only"> {r.name}</span>
                    </button>
                  ) : null}
                  {r.status === 'confirmed' || r.status === 'waitlisted' || r.status === 'offered' ? (
                    <button className="btn small" onClick={() => run(() => app.registrations.cancel(r.cancelToken))}>
                      Cancelar<span className="sr-only"> {r.name}</span>
                    </button>
                  ) : null}
                </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
