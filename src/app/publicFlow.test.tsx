import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Container } from './container'
import { renderApp } from '../test/renderApp'

type User = ReturnType<typeof userEvent.setup>

async function fill(user: User, n: number) {
  await user.type(screen.getByLabelText(/nombre/i), `Persona ${n}`)
  await user.type(screen.getByLabelText(/correo/i), `persona${n}@example.com`)
  await user.type(screen.getByLabelText(/tel[eé]fono/i), '223 555 0000')
}

const input = (n: number) => ({ name: `A${n}`, email: `a${n}@x.com`, phone: '2235550000', consent: true })

describe('public flow', () => {
  it('lists upcoming activities with free seats', async () => {
    await renderApp('/')
    const items = await screen.findAllByRole('article')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByText(/1 lugar disponible/i)).toBeInTheDocument()
  })

  it('shows validation errors and then confirms with QR and cancel link', async () => {
    await renderApp('/')
    const user = userEvent.setup()
    await user.click((await screen.findAllByRole('link', { name: /ver detalle/i }))[1])
    await user.click(await screen.findByRole('button', { name: /inscribirme/i }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    await fill(user, 1)
    await user.click(screen.getByLabelText(/acepto/i))
    await user.click(screen.getByRole('button', { name: /inscribirme/i }))
    expect(await screen.findByRole('heading', { name: /inscripción confirmada/i })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /código qr/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cancelar mi inscripción/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/cancel/'),
    )
  })

  it('puts the person on the waitlist when the activity is full', async () => {
    const { app: container } = await renderApp('/')
    const [nearlyFull] = await container.activities.listUpcoming()
    await container.registrations.register(nearlyFull.id, input(9))
    const user = userEvent.setup()
    await user.click((await screen.findAllByRole('link', { name: /ver detalle/i }))[0])
    await fill(user, 2)
    await user.click(screen.getByLabelText(/acepto/i))
    await user.click(screen.getByRole('button', { name: /inscribirme/i }))
    expect(await screen.findByRole('heading', { name: /lista de espera/i })).toBeInTheDocument()
    expect(screen.getByText(/posición 1/i)).toBeInTheDocument()
  })

  it('cancels from the cancel link', async () => {
    await renderApp(async (c: Container) => {
      const [a] = await c.activities.listUpcoming()
      const { registration } = await c.registrations.register(a.id, input(1))
      return `/cancel/${registration.cancelToken}`
    })
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: /inscripción confirmada/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancelar mi inscripción/i }))
    await user.click(screen.getByRole('button', { name: /sí, cancelar/i }))
    expect(await screen.findByRole('heading', { name: /inscripción cancelada/i })).toBeInTheDocument()
  })

  it('confirms a seat offer from the offer link', async () => {
    await renderApp(async (c: Container) => {
      const [a] = await c.activities.listUpcoming()
      const first = await c.registrations.register(a.id, input(1))
      const waiting = await c.registrations.register(a.id, input(2))
      await c.registrations.register(a.id, input(3))
      await c.registrations.cancel(first.registration.cancelToken)
      const offered = (await c.registrations.listForActivity(a.id)).find((r) => r.id === waiting.registration.id)
      return `/offer/${offered!.offerToken}`
    })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /confirmar mi lugar/i }))
    expect(await screen.findByRole('heading', { name: /inscripción confirmada/i })).toBeInTheDocument()
  })
})
