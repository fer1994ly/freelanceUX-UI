import { useEffect, useRef, useState } from 'react'

interface Props {
  onScan: (code: string) => void
}

/** Camera QR scanner (html5-qrcode, loaded lazily). Manual entry stays available as fallback. */
export function Scanner({ onScan }: Props) {
  const [error, setError] = useState('')
  const onScanRef = useRef(onScan)
  useEffect(() => {
    onScanRef.current = onScan
  })

  useEffect(() => {
    let stop: (() => Promise<void>) | undefined
    let cancelled = false
    import('html5-qrcode')
      .then(async ({ Html5Qrcode }) => {
        const scanner = new Html5Qrcode('qr-reader')
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (text) => onScanRef.current(text),
          () => undefined,
        )
        stop = async () => {
          await scanner.stop()
          scanner.clear()
        }
        if (cancelled) await stop()
      })
      .catch(() => setError('No se pudo acceder a la cámara. Ingresa el código manualmente.'))
    return () => {
      cancelled = true
      void stop?.()
    }
  }, [])

  return (
    <div>
      <div id="qr-reader" />
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  )
}
