export const formatDateTime = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' }) : 'Fecha a definir'

export const formatPrice = (ars: number): string =>
  ars === 0 ? 'Gratuito' : `$ ${ars.toLocaleString('es-AR')} (ARS, informativo)`

/** ISO -> value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null)
