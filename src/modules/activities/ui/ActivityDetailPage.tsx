import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../../shared/ui/AppContext'
import { formatDateTime, formatPrice } from '../../../shared/ui/format'
import { useAsync } from '../../../shared/ui/useAsync'
import type { RegistrationView } from '../../registrations/application/registrationService'
import { RegistrationForm } from '../../registrations/ui/RegistrationForm'
import { RegistrationStatus } from '../../registrations/ui/RegistrationStatus'
import { seatsLabel } from './seatsLabel'

export function ActivityDetailPage() {
  const { id = '' } = useParams()
  const app = useApp()
  const [done, setDone] = useState<RegistrationView>()
  const { data, loading } = useAsync(async () => {
    const activity = await app.activities.get(id)
    if (!activity) return undefined
    return { activity, free: activity.capacity - (await app.registrations.occupiedSeats(id)) }
  }, id)

  if (loading) return <p>Cargando…</p>
  if (!data) return <p className="notice">No encontramos la actividad. <Link to="/">Volver al listado</Link></p>
  const { activity, free } = data

  return (
    <>
      <p><Link to="/">← Todas las actividades</Link></p>
      <h1>{activity.title}</h1>
      <section className="card stack">
        <p>{activity.description}</p>
        <dl className="meta">
          <dt>Fecha</dt><dd>{formatDateTime(activity.startsAt)}</dd>
          <dt>Lugar</dt><dd>{activity.location}</dd>
          <dt>Precio</dt><dd>{formatPrice(activity.priceArs)}</dd>
          <dt>Cupo</dt><dd>{seatsLabel(free)}</dd>
        </dl>
      </section>
      {done ? (
        <RegistrationStatus view={done} mode="result" onChanged={() => undefined} />
      ) : (
        <RegistrationForm activityId={activity.id} full={free <= 0} onDone={setDone} />
      )}
    </>
  )
}
