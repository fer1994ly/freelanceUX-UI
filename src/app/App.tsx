import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ActivityDetailPage } from '../modules/activities/ui/ActivityDetailPage'
import { ActivityListPage } from '../modules/activities/ui/ActivityListPage'
import { CancelPage } from '../modules/registrations/ui/CancelPage'
import { OfferPage } from '../modules/registrations/ui/OfferPage'
import { SurveyPage } from '../modules/surveys/ui/SurveyPage'
import { AppProvider } from '../shared/ui/AppContext'
import { BrowserLockManager } from '../shared/lock'
import { AdminPage } from './admin/AdminPage'
import { createContainer } from './container'
import { seedDemoData } from './seed'
import './styles.css'

export function AppRoutes() {
  return (
    <>
      <a className="skip" href="#main">Saltar al contenido</a>
      <header className="site-header">
        <Link to="/" className="brand">Talleres y eventos</Link>
        <nav aria-label="Principal"><Link to="/admin">Administración</Link></nav>
      </header>
      <main id="main" className="page">
        <Routes>
          <Route path="/" element={<ActivityListPage />} />
          <Route path="/actividad/:id" element={<ActivityDetailPage />} />
          <Route path="/cancel/:token" element={<CancelPage />} />
          <Route path="/offer/:token" element={<OfferPage />} />
          <Route path="/survey/:token" element={<SurveyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<p className="notice">Página no encontrada. <Link to="/">Ir al inicio</Link></p>} />
        </Routes>
      </main>
    </>
  )
}

export function App() {
  const container = useMemo(() => createContainer(), [])
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // Seeding is idempotent; the lock keeps two first-load tabs from both seeding.
    new BrowserLockManager()
      .withLock('seed', () => seedDemoData(container))
      .finally(() => setReady(true))
  }, [container])
  if (!ready) return <p className="page">Cargando…</p>
  return (
    <AppProvider container={container}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
