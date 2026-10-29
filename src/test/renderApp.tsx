import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createContainer } from '../app/container'
import { AppRoutes } from '../app/App'
import { AppProvider } from '../shared/ui/AppContext'
import { FakeClock } from '../shared/testing/fakeClock'
import { seedDemoData } from '../app/seed'
import type { Container } from '../app/container'

export async function renderApp(
  route: string | ((c: Container) => Promise<string>) = '/',
  opts: { seed?: boolean } = {},
) {
  const clock = new FakeClock('2026-11-01T10:00:00.000Z')
  const container = createContainer({ clock, adminPin: '4321' })
  if (opts.seed !== false) await seedDemoData(container)
  const initial = typeof route === 'string' ? route : await route(container)
  const utils = render(
    <AppProvider container={container}>
      <MemoryRouter initialEntries={[initial]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
  return { ...utils, app: container, clock }
}
