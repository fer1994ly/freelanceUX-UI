import { waitlistPosition } from '../../registrations/domain/book'
import type { Registration } from '../../registrations/domain/registration'

const BOM = '\uFEFF'
const HEADER = ['list', 'status', 'name', 'email', 'phone', 'registeredAt', 'waitlistPosition', 'checkedInAt']
const PHONE_LIKE = /^[+-][\d\s().-]+$/

/** RFC 4180 quoting plus neutralization of spreadsheet formula prefixes. */
export function escapeCsvCell(value: string): string {
  let v = value
  if (/^[=@\t\r]/.test(v) || (/^[+-]/.test(v) && !PHONE_LIKE.test(v))) v = `'${v}`
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function listOf(r: Registration): string {
  if (r.status === 'confirmed') return 'registrants'
  if (r.status === 'waitlisted' || r.status === 'offered') return 'waitlist'
  return r.status
}

/** One row per person: list, status, contact data, waitlist position and check-in time. */
export function buildAttendanceCsv(registrations: Registration[]): string {
  const book = { id: '', registrations, version: 0 }
  const rows = registrations.map((r) => [
    listOf(r),
    r.status,
    r.name,
    r.email,
    r.phone,
    r.createdAt,
    String(waitlistPosition(book, r.id) ?? ''),
    r.checkedInAt ?? '',
  ])
  return BOM + [HEADER, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
}
