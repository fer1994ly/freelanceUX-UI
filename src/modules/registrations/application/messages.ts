import type { Activity } from '../../activities/domain/activity'
import type { Registration } from '../domain/registration'
import type { Notification, NotificationKind } from './ports'

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' }) : 'a confirmar'

/** Builds the (Spanish) message for a registration event. Links are app-relative paths. */
export function buildNotification(
  kind: NotificationKind,
  r: Registration,
  activity: Activity,
  position: number | null,
): Notification {
  const base = { kind, to: r.email, name: r.name, activityId: activity.id, registrationId: r.id }
  const cancelLine = `Si no puedes asistir, cancela tu lugar en /cancel/${r.cancelToken}`
  switch (kind) {
    case 'confirmation':
      return {
        ...base,
        subject: `Inscripción confirmada: ${activity.title}`,
        body: `Hola ${r.name}, tu lugar en "${activity.title}" está confirmado (${when(activity.startsAt)}, ${activity.location}). Presenta tu código QR en /cancel/${r.cancelToken}. ${cancelLine}`,
      }
    case 'waitlisted':
      return {
        ...base,
        subject: `Lista de espera: ${activity.title}`,
        body: `Hola ${r.name}, no quedan lugares en "${activity.title}". Quedaste en lista de espera (posición ${position ?? '-'}). Te avisaremos si se libera un lugar. ${cancelLine}`,
      }
    case 'seat-offered':
      return {
        ...base,
        subject: `Se liberó un lugar: ${activity.title}`,
        body: `Hola ${r.name}, se liberó un lugar en "${activity.title}". Tienes hasta ${when(r.offerExpiresAt)} para confirmarlo en /offer/${r.offerToken}. Pasado ese plazo se ofrecerá a la siguiente persona.`,
      }
    case 'cancellation':
      return {
        ...base,
        subject: `Inscripción cancelada: ${activity.title}`,
        body: `Hola ${r.name}, cancelamos tu inscripción a "${activity.title}". Gracias por avisar.`,
      }
  }
}
