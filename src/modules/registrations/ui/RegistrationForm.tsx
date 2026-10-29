import { useState, type FormEvent } from 'react'
import { useApp } from '../../../shared/ui/AppContext'
import { Field } from '../../../shared/ui/Field'
import { errorMessage } from '../../../shared/ui/messages'
import { registrantErrors, type RegistrantField } from '../domain/book'
import type { RegistrationView } from '../application/registrationService'

interface Props {
  activityId: string
  full: boolean
  onDone: (view: RegistrationView) => void
}

export function RegistrationForm({ activityId, full, onDone }: Props) {
  const app = useApp()
  const [values, setValues] = useState({ name: '', email: '', phone: '', consent: false })
  const [errors, setErrors] = useState<Partial<Record<RegistrantField, string>>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found = registrantErrors(values)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      const { registration } = await app.registrations.register(activityId, values)
      const view = await app.registrations.findByCancelToken(registration.cancelToken)
      if (view) onDone(view)
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card stack" aria-label="Formulario de inscripción">
      <h2>{full ? 'Anótate en la lista de espera' : 'Inscríbete'}</h2>
      {full ? <p className="notice">El cupo está completo. Si se libera un lugar, tendrás 24 horas para confirmarlo.</p> : null}
      <Field
        label="Nombre y apellido"
        autoComplete="name"
        value={values.name}
        onChange={(e) => set({ name: e.target.value })}
        error={errors.name && errorMessage(new Error(errors.name))}
      />
      <Field
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={values.email}
        onChange={(e) => set({ email: e.target.value })}
        error={errors.email && errorMessage(new Error(errors.email))}
      />
      <Field
        label="Teléfono"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={values.phone}
        onChange={(e) => set({ phone: e.target.value })}
        error={errors.phone && errorMessage(new Error(errors.phone))}
      />
      <div className="field check">
        <input
          id="consent"
          type="checkbox"
          checked={values.consent}
          onChange={(e) => set({ consent: e.target.checked })}
          aria-invalid={errors.consent ? true : undefined}
        />
        <label htmlFor="consent">Acepto el tratamiento de mis datos personales para gestionar esta inscripción.</label>
        {errors.consent ? <p className="error" role="alert">{errorMessage(new Error(errors.consent))}</p> : null}
      </div>
      {formError ? <p className="error" role="alert">{formError}</p> : null}
      <button type="submit" className="btn primary" disabled={busy}>
        {full ? 'Inscribirme en lista de espera' : 'Inscribirme'}
      </button>
    </form>
  )
}
