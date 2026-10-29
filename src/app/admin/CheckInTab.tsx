import { useRef, useState, type ComponentType, type FormEvent } from 'react'
import { useApp } from '../../shared/ui/AppContext'
import { Field } from '../../shared/ui/Field'
import { errorMessage } from '../../shared/ui/messages'
import { Scanner } from './Scanner'

/** Ignore the same decoded token for this long: the camera decodes every frame. */
const SCAN_DEDUPE_MS = 3000

interface Props {
  /** Injectable for tests. */
  Scanner?: ComponentType<{ onScan: (code: string) => void }>
  now?: () => number
}

export function CheckInTab({ Scanner: ScannerView = Scanner, now = Date.now }: Props = {}) {
  const app = useApp()
  const [code, setCode] = useState('')
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')
  const [camera, setCamera] = useState(false)
  const inFlight = useRef(false)
  const last = useRef<{ token: string; at: number } | null>(null)

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

  async function onScan(raw: string) {
    const token = raw.trim()
    const at = now()
    if (inFlight.current) return
    if (last.current && last.current.token === token && at - last.current.at < SCAN_DEDUPE_MS) return
    inFlight.current = true
    last.current = { token, at }
    try {
      await checkIn(token)
    } finally {
      inFlight.current = false
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
      {camera ? <ScannerView onScan={(t) => void onScan(t)} /> : null}
    </div>
  )
}
