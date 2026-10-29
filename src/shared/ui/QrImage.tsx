import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export function QrImage({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, { margin: 1, width: 240 }).then((url) => alive && setSrc(url))
    return () => {
      alive = false
    }
  }, [value])
  return src ? <img className="qr" src={src} alt={label} width={240} height={240} /> : null
}
