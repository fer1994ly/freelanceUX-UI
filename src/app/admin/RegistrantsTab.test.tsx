import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createContainer } from '../container'
import { seedDemoData } from '../seed'
import { AppProvider } from '../../shared/ui/AppContext'
import { FakeClock } from '../../shared/testing/fakeClock'
import { RegistrantsTab } from './RegistrantsTab'

async function setup() {
  const container = createContainer({ clock: new FakeClock('2026-11-01T10:00:00.000Z'), adminPin: '1' })
  await seedDemoData(container)
  render(
    <AppProvider container={container}>
      <RegistrantsTab />
    </AppProvider>,
  )
  return container
}

describe('RegistrantsTab CSV export', () => {
  it('shows an accessible alert when the export fails', async () => {
    const container = await setup()
    vi.spyOn(container.reports, 'exportCsv').mockRejectedValue(new Error('boom'))
    await userEvent.setup().click(await screen.findByRole('button', { name: /exportar csv/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo exportar el CSV. Intenta de nuevo.')
  })
})
