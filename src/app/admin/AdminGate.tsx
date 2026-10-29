import { useState, type FormEvent, type ReactNode } from 'react'
import { useApp } from '../../shared/ui/AppContext'
import { Field } from '../../shared/ui/Field'

export const ADMIN_SESSION_KEY = 'er.admin'

/**
 * Client-side PIN gate. NOT real security: the PIN ships in the JS bundle.
 * It only keeps casual visitors out of the panel.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const app = useApp()
  const [ok, setOk] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  if (ok) return <>{children}</>

  function submit(e: FormEvent) {
    e.preventDefault()
    if (pin === app.adminPin) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      setOk(true)
    } else {
      setError('PIN incorrecto.')
    }
  }

  return (
    <form onSubmit={submit} className="card stack narrow">
      <h1>Acceso al panel</h1>
      <Field
        label="PIN"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        error={error}
      />
      <button className="btn primary" type="submit">Ingresar</button>
    </form>
  )
}
