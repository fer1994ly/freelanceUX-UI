import { useState, type FormEvent } from 'react'
import { useApp } from '../../shared/ui/AppContext'
import { Field } from '../../shared/ui/Field'
import { errorMessage } from '../../shared/ui/messages'
import { Scanner } from './Scanner'

export function CheckInTab() {
  const app = useApp()
  const [code, setCode] = useState('')
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')
  const [camera, setCamera] = useState(false)

  async function checkIn(token: string) {
    setOk('')
    setError('')
    try {
      const r = await app.attendance.checkIn(token.trim())
      setOk(`Ingreso registrado: ${r.name}`)
      setCode('')
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void checkIn(code)
  }

  return (
    <div className="stack">
      <form onSubmit={submit} className="card stack">
        <Field
          label="Código de ingreso"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          hint="Escanea el QR con la cámara o escribe el código que aparece debajo del QR."
        />
        <button className="btn primary" type="submit">Registrar ingreso</button>
      </form>
      {ok ? <p className="notice ok" role="status">{ok}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button className="btn" onClick={() => setCamera((c) => !c)}>
        {camera ? 'Cerrar cámara' : 'Escanear con cámara'}
      </button>
      {camera ? <Scanner onScan={(t) => void checkIn(t)} /> : null}
    </div>
  )
}
