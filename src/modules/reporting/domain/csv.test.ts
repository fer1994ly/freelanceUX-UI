import { describe, expect, it } from 'vitest'
import { emptyBook, registerInBook } from '../../registrations/domain/book'
import { SequentialIds } from '../../../shared/testing/sequentialIds'
import { buildAttendanceCsv, escapeCsvCell } from './csv'

describe('escapeCsvCell', () => {
  it('leaves plain text, quotes commas, quotes and newlines', () => {
    expect(escapeCsvCell('abc')).toBe('abc')
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvCell('l1\nl2')).toBe('"l1\nl2"')
  })
  it('neutralizes spreadsheet formulas', () => {
    expect(escapeCsvCell('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(escapeCsvCell('@cmd')).toBe("'@cmd")
  })
})

describe('buildAttendanceCsv', () => {
  const now = new Date('2026-12-01T15:00:00.000Z')
  const ids = new SequentialIds()
  const reg = (book = emptyBook('a'), n: number, name: string) =>
    registerInBook(book, { name, email: `p${n}@x.com`, phone: '+54 223 555 0000', consent: true }, { capacity: 1, now, ids }).book

  it('starts with a UTF-8 BOM and one row per person with list and checkedInAt', () => {
    let book = reg(undefined, 1, 'María, "Mari" Pérez')
    book = reg(book, 2, 'Juan')
    book.registrations[0] = { ...book.registrations[0], checkedInAt: '2026-12-01T15:05:00.000Z' }
    const csv = buildAttendanceCsv(book.registrations)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toBe('list,status,name,email,phone,registeredAt,waitlistPosition,checkedInAt')
    expect(lines[1]).toBe('registrants,confirmed,"María, ""Mari"" Pérez",p1@x.com,+54 223 555 0000,2026-12-01T15:00:00.000Z,,2026-12-01T15:05:00.000Z')
    expect(lines[2]).toBe('waitlist,waitlisted,Juan,p2@x.com,+54 223 555 0000,2026-12-01T15:00:00.000Z,1,')
    expect(lines).toHaveLength(3)
  })
})
