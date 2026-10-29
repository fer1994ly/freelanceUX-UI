import { createContext, useContext, type ReactNode } from 'react'
import type { Container } from '../../app/container'

const Ctx = createContext<Container | null>(null)

export function AppProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <Ctx.Provider value={container}>{children}</Ctx.Provider>
}

export function useApp(): Container {
  const c = useContext(Ctx)
  if (!c) throw new Error('AppProvider missing')
  return c
}
