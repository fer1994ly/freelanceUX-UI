import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createContainer } from '../container'
import { AppProvider } from '../../shared/ui/AppContext'
import { DomainError } from '../../shared/errors'
import { CheckInTab } from './CheckInTab'

const scanner: { emit: (token: string) => void } = { emit: () => undefined }
const emit = (token: string) => scanner.emit(token)
function FakeScanner({ onScan }: { onScan: (code: string) => void }) {
  useEffect(() => {
    scanner.emit = onScan
  })
  return <div data-testid="fake-scanner" />
}

async function setup(checkIn: (token: string) => Promise<{ name: string }>, now: () => number) {
  const container = createContainer({ adminPin: '1' })
  const spy = vi.spyOn(container.attendance, 'checkIn').mockImplementation(checkIn as never)
  render(
    <AppProvider container={container}>
      <CheckInTab Scanner={FakeScanner} now={now} />
    </AppProvider>,
  )
  await userEvent.setup().click(screen.getByRole('button', { name: /escanear con cámara/i }))
  return spy
}

describe('CheckInTab camera scanning', () => {
  it('processes a repeated decode of the same token once and keeps the success message', async () => {
    let t = 1000
    const spy = await setup(async () => ({ name: 'Lu' }), () => t)
    await act(async () => {
      emit('tok-1')
      emit('tok-1')
      emit('tok-1')
    })
    t += 500
    await act(async () => emit('tok-1'))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/ingreso registrado: lu/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('ignores a different token while a check-in is in flight, then processes it', async () => {
    let t = 1000
    let release: () => void = () => undefined
    const spy = await setup(
      (token) =>
        token === 'a'
          ? new Promise((r) => { release = () => r({ name: 'A' }) })
          : Promise.resolve({ name: 'B' }),
      () => t,
    )
    await act(async () => emit('a'))
    await act(async () => emit('b'))
    expect(spy).toHaveBeenCalledTimes(1)
    await act(async () => release())
    t += 10
    await act(async () => emit('b'))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(await screen.findByText(/ingreso registrado: b/i)).toBeInTheDocument()
  })

  it('processes the same token again after the dedupe window', async () => {
    let t = 1000
    const spy = await setup(async () => { throw new DomainError('already_checked_in') }, () => t)
    await act(async () => emit('x'))
    t += 3001
    await act(async () => emit('x'))
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
