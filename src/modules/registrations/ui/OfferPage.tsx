import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../../../shared/ui/AppContext'
import { formatDateTime } from '../../../shared/ui/format'
import { errorMessage } from '../../../shared/ui/messages'
import { useAsync } from '../../../shared/ui/useAsync'
import type { RegistrationView } from '../application/registrationService'
import { RegistrationStatus } from './RegistrationStatus'

export function OfferPage() {
  const { token = '' } = useParams()
  const app = useApp()
  const { data, loading, reload } = useAsync(() => app.registrations.findByToken('offer', token), token)
  const [confirmed, setConfirmed] = useState<RegistrationView>()
  const [error, setError] = useState('')

  async function confirm() {
    try {
      const r = await app.registrations.confirmOffer(token)
      setConfirmed(await app.registrations.findByCancelToken(r.cancelToken))
    } catch (e) {
      setError(errorMessage(e))
      reload()
    }
  }

  if (confirmed) return <RegistrationStatus view={confirmed} mode="result" onChanged={reload} />
  if (loading) return <p>Cargando…</p>
  if (!data) return <p className="notice">Este enlace no es válido o el plazo ya venció.</p>
  const { registration: r, activity } = data
  if (r.status !== 'offered') {
    return <p className="notice">{errorMessage(new Error(r.status === 'expired' ? 'offer_expired' : 'offer_invalid'))}</p>
  }
  return (
    <section className="card stack">
      <h1>Confirma tu lugar</h1>
      <p>Se liberó un lugar en <strong>{activity.title}</strong> ({formatDateTime(activity.startsAt)}).</p>
      <p>Tienes hasta {formatDateTime(r.offerExpiresAt)} para confirmarlo.</p>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button className="btn primary" onClick={confirm}>Confirmar mi lugar</button>
    </section>
  )
}
