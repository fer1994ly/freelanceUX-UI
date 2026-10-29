import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../../../shared/ui/format'
import { QrImage } from '../../../shared/ui/QrImage'
import { useApp } from '../../../shared/ui/AppContext'
import { errorMessage } from '../../../shared/ui/messages'
import type { RegistrationView } from '../application/registrationService'

interface Props {
  view: RegistrationView
  /** `result`: right after signing up (shows a cancel link). `manage`: the cancel page. */
  mode: 'result' | 'manage'
  onChanged: () => void
}

export function RegistrationStatus({ view, mode, onChanged }: Props) {
  const app = useApp()
  const { registration: r, activity, position } = view
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const started = activity.startsAt !== null && Date.parse(activity.startsAt) <= app.clock.now().getTime()

  async function cancel() {
    try {
      await app.registrations.cancel(r.cancelToken)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const cancelControl =
    r.status === 'confirmed' || r.status === 'waitlisted' || r.status === 'offered' ? (
      mode === 'result' ? (
        <Link className="btn" to={`/cancel/${r.cancelToken}`}>Cancelar mi inscripción</Link>
      ) : confirming ? (
        <div className="row">
          <button className="btn danger" onClick={cancel}>Sí, cancelar</button>
          <button className="btn" onClick={() => setConfirming(false)}>No, mantener</button>
        </div>
      ) : (
        <button className="btn" onClick={() => setConfirming(true)}>Cancelar mi inscripción</button>
      )
    ) : null

  return (
    <section className="card stack" aria-live="polite">
      {r.status === 'confirmed' && (
        <>
          <h2>Inscripción confirmada</h2>
          <p>Presenta este código QR al ingresar.</p>
          <QrImage value={r.checkInToken} label="Código QR de ingreso" />
          <p>Código de ingreso: <strong className="code">{r.checkInToken}</strong></p>
        </>
      )}
      {r.status === 'waitlisted' && (
        <>
          <h2>Estás en lista de espera</h2>
          <p>Posición {position}. Si se libera un lugar, tendrás 24 horas para confirmarlo.</p>
          <p className="hint">Guarda el enlace de cancelación para consultar tu lugar más tarde.</p>
        </>
      )}
      {r.status === 'offered' && (
        <>
          <h2>Se liberó un lugar para ti</h2>
          <p>Tienes hasta {formatDateTime(r.offerExpiresAt)} para confirmarlo.</p>
          <Link className="btn primary" to={`/offer/${r.offerToken}`}>Confirmar mi lugar</Link>
        </>
      )}
      {r.status === 'cancelled' && <h2>Inscripción cancelada</h2>}
      {r.status === 'expired' && (
        <>
          <h2>El plazo para confirmar venció</h2>
          <p>El lugar se ofreció a la siguiente persona. Puedes inscribirte nuevamente.</p>
        </>
      )}
      <dl className="meta">
        <dt>Actividad</dt><dd>{activity.title}</dd>
        <dt>Fecha</dt><dd>{formatDateTime(activity.startsAt)}</dd>
        <dt>Lugar</dt><dd>{activity.location}</dd>
        <dt>Nombre</dt><dd>{r.name}</dd>
      </dl>
      {error ? <p className="error" role="alert">{error}</p> : null}
      {cancelControl}
      {mode === 'result' && r.status === 'confirmed' ? (
        <p className="hint">Enlace para ver o cancelar tu inscripción: {`${location.origin}/cancel/${r.cancelToken}`}</p>
      ) : null}
      {started && r.status === 'confirmed' ? (
        <Link className="btn" to={`/survey/${r.surveyToken}`}>Responder la encuesta</Link>
      ) : null}
    </section>
  )
}
