import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Container } from './container'
import { renderApp } from '../test/renderApp'

type User = ReturnType<typeof userEvent.setup>

async function unlock(user: User) {
  await user.type(await screen.findByLabelText(/pin/i), '4321')
  await user.click(screen.getByRole('button', { name: /ingresar/i }))
}

describe('admin panel', () => {
  it('is gated by the PIN', async () => {
    await renderApp('/admin')
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText(/pin/i), '0000')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/pin incorrecto/i)
    await user.clear(screen.getByLabelText(/pin/i))
    await unlock(user)
    expect(await screen.findByRole('heading', { name: /panel de administración/i })).toBeInTheDocument()
    expect(sessionStorage.getItem('er.admin')).toBe('1')
  })

  it('duplicates an activity without its date', async () => {
    await renderApp('/admin')
    const user = userEvent.setup()
    await unlock(user)
    const rows = await screen.findAllByRole('row')
    await user.click(within(rows[1]).getByRole('button', { name: /duplicar/i }))
    expect(await screen.findByText(/fecha a definir/i)).toBeInTheDocument()
  })

  it('creates an activity from the form', async () => {
    await renderApp('/admin')
    const user = userEvent.setup()
    await unlock(user)
    await user.click(await screen.findByRole('button', { name: /nueva actividad/i }))
    await user.type(screen.getByLabelText(/título/i), 'Taller nuevo')
    await user.type(screen.getByLabelText(/fecha y hora/i), '2026-12-20T10:00')
    await user.type(screen.getByLabelText(/lugar/i), 'Estudio')
    await user.clear(screen.getByLabelText(/cupo/i))
    await user.type(screen.getByLabelText(/cupo/i), '4')
    await user.click(screen.getByRole('button', { name: /guardar/i }))
    expect(await screen.findByRole('cell', { name: 'Taller nuevo' })).toBeInTheDocument()
  })

  it('check-in by manual code: second use is rejected', async () => {
    let token = ''
    await renderApp(async (c: Container) => {
      const [a] = await c.activities.listUpcoming()
      const r = await c.registrations.register(a.id, { name: 'Lu', email: 'lu@x.com', phone: '2235550000', consent: true })
      token = r.registration.checkInToken
      return '/admin'
    })
    const user = userEvent.setup()
    await unlock(user)
    await user.click(await screen.findByRole('tab', { name: /ingreso/i }))
    await user.type(await screen.findByLabelText(/código de ingreso/i), token)
    await user.click(screen.getByRole('button', { name: /registrar ingreso/i }))
    expect(await screen.findByText(/ingreso registrado: lu/i)).toBeInTheDocument()
    await user.clear(screen.getByLabelText(/código de ingreso/i))
    await user.type(screen.getByLabelText(/código de ingreso/i), token)
    await user.click(screen.getByRole('button', { name: /registrar ingreso/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/ya fue utilizado/i)
  })

  it('shows the notification outbox', async () => {
    await renderApp(async (c: Container) => {
      const [a] = await c.activities.listUpcoming()
      await c.registrations.register(a.id, { name: 'Ou', email: 'ou@x.com', phone: '2235550000', consent: true })
      return '/admin'
    })
    const user = userEvent.setup()
    await unlock(user)
    await user.click(await screen.findByRole('tab', { name: /mensajes/i }))
    expect(await screen.findByText(/ou@x\.com/)).toBeInTheDocument()
  })
})
