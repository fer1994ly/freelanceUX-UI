import { useState } from 'react'
import type { Activity } from '../../modules/activities/domain/activity'
import { useApp } from '../../shared/ui/AppContext'
import { formatDateTime } from '../../shared/ui/format'
import { errorMessage } from '../../shared/ui/messages'
import { useAsync } from '../../shared/ui/useAsync'
import { ActivityForm } from './ActivityForm'

const STATUS = { published: 'Publicada', draft: 'Borrador', cancelled: 'Cancelada' } as const

export function ActivitiesTab() {
  const app = useApp()
  const { data, reload } = useAsync(() => app.activities.listAll(), 'all-activities')
  const [editing, setEditing] = useState<Activity | 'new' | null>(null)
  const [error, setError] = useState('')

  async function duplicate(a: Activity) {
    try {
      const copy = await app.activities.duplicate(a.id)
      reload()
      setEditing(copy)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={() => setEditing('new')}>Nueva actividad</button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      {editing ? (
        <ActivityForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={async (input) => {
            if (editing === 'new') await app.activities.create(input)
            else await app.activities.update(editing.id, input)
            setEditing(null)
            reload()
          }}
        />
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Título</th><th>Fecha</th><th>Cupo</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{formatDateTime(a.startsAt)}</td>
                <td>{a.capacity}</td>
                <td>{STATUS[a.status]}</td>
                <td className="row">
                  <button className="btn small" onClick={() => setEditing(a)}>
                    Editar<span className="sr-only"> {a.title}</span>
                  </button>
                  <button className="btn small" onClick={() => duplicate(a)}>
                    Duplicar<span className="sr-only"> {a.title}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
