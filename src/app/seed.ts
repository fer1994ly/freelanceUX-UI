import type { Container } from './container'

const DAY = 24 * 3_600_000

const people = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Facundo']

/** Seeds demo activities on first load (empty storage). Returns true if it seeded. */
export async function seedDemoData(c: Container): Promise<boolean> {
  if ((await c.activities.listAll()).length > 0) return false
  const at = (days: number, hour: number) => {
    const d = new Date(c.clock.now().getTime() + days * DAY)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }
  const base = { location: 'Estudio UX/UI, Mar del Plata', priceArs: 0 }
  const figma = await c.activities.create({
    ...base,
    title: 'Taller de prototipado en Figma',
    description: 'Aprende a crear prototipos interactivos en una tarde, con práctica guiada.',
    startsAt: at(7, 15),
    capacity: 6,
    priceArs: 18000,
  })
  await c.activities.create({
    ...base,
    title: 'Introducción a la investigación de usuarios',
    description: 'Entrevistas, síntesis y hallazgos accionables.',
    startsAt: at(14, 10),
    capacity: 12,
    priceArs: 12000,
  })
  await c.activities.create({
    ...base,
    title: 'Revisión de portfolios UX/UI',
    description: 'Devolución personalizada sobre tu portfolio.',
    startsAt: at(21, 18),
    capacity: 8,
  })
  for (const [i, name] of people.slice(0, 5).entries()) {
    await c.registrations.register(figma.id, {
      name,
      email: `${name.toLowerCase()}@demo.example`,
      phone: `223 555 01${i}0`,
      consent: true,
    })
  }
  c.outbox.clear()
  return true
}

/** Removes every key owned by the app and seeds again. */
export async function resetDemoData(c: Container): Promise<void> {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('er.')) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
  await seedDemoData(c)
}
