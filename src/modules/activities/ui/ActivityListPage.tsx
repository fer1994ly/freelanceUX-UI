import { Link } from 'react-router-dom'
import { useApp } from '../../../shared/ui/AppContext'
import { formatDateTime, formatPrice } from '../../../shared/ui/format'
import { useAsync } from '../../../shared/ui/useAsync'
import { seatsLabel } from './seatsLabel'

export function ActivityListPage() {
  const app = useApp()
  const { data, loading } = useAsync(async () => {
    const list = await app.activities.listUpcoming()
    return Promise.all(
      list.map(async (activity) => ({
        activity,
        free: activity.capacity - (await app.registrations.occupiedSeats(activity.id)),
      })),
    )
  }, 'upcoming')

  if (loading) return <p>Cargando…</p>
  return (
    <>
      <h1>Próximas actividades</h1>
      {data?.length ? (
        <div className="grid">
          {data.map(({ activity, free }) => (
            <article key={activity.id} className="card stack">
              <h2>{activity.title}</h2>
              <p>{formatDateTime(activity.startsAt)}</p>
              <p>{activity.location}</p>
              <p>{formatPrice(activity.priceArs)}</p>
              <p className={free > 0 ? 'badge ok' : 'badge'}>{seatsLabel(free)}</p>
              <Link className="btn primary" to={`/actividad/${activity.id}`}>
                Ver detalle<span className="sr-only">: {activity.title}</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="notice">Por ahora no hay actividades programadas. ¡Vuelve pronto!</p>
      )}
    </>
  )
}
