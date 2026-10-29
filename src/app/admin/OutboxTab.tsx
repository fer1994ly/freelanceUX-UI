import { useApp } from '../../shared/ui/AppContext'
import { formatDateTime } from '../../shared/ui/format'
import { useAsync } from '../../shared/ui/useAsync'

const KIND = {
  confirmation: 'Confirmación',
  waitlisted: 'Lista de espera',
  'seat-offered': 'Lugar ofrecido',
  cancellation: 'Cancelación',
} as const

export function OutboxTab() {
  const app = useApp()
  const { data } = useAsync(async () => app.outbox.list().slice().reverse(), 'outbox')
  return (
    <div className="stack">
      <p className="hint">No se envían correos reales: aquí se registran los mensajes que se enviarían.</p>
      {data?.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Para</th><th>Asunto y mensaje</th></tr></thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id}>
                  <td>{formatDateTime(m.createdAt)}</td>
                  <td>{KIND[m.kind]}</td>
                  <td>{m.to}</td>
                  <td><strong>{m.subject}</strong><br />{m.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="notice">No hay mensajes todavía.</p>
      )}
    </div>
  )
}
