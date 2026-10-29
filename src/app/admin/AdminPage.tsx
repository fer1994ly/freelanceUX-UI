import { useState } from 'react'
import { useApp } from '../../shared/ui/AppContext'
import { resetDemoData } from '../seed'
import { ActivitiesTab } from './ActivitiesTab'
import { AdminGate } from './AdminGate'
import { CheckInTab } from './CheckInTab'
import { OutboxTab } from './OutboxTab'
import { RegistrantsTab } from './RegistrantsTab'
import { SurveysTab } from './SurveysTab'

const TABS = [
  { id: 'activities', label: 'Actividades', panel: ActivitiesTab },
  { id: 'registrants', label: 'Inscripciones', panel: RegistrantsTab },
  { id: 'checkin', label: 'Ingreso', panel: CheckInTab },
  { id: 'outbox', label: 'Mensajes', panel: OutboxTab },
  { id: 'surveys', label: 'Encuestas', panel: SurveysTab },
] as const

function Panel() {
  const app = useApp()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('activities')
  const [version, setVersion] = useState(0)
  const Active = TABS.find((t) => t.id === tab)!.panel

  async function reset() {
    if (!window.confirm('Se borrarán todos los datos de este navegador y se cargarán los de demostración. ¿Continuar?')) return
    await resetDemoData(app)
    setVersion((v) => v + 1)
  }

  return (
    <>
      <h1>Panel de administración</h1>
      <div role="tablist" aria-label="Secciones" className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="panel"
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel" aria-labelledby={`tab-${tab}`} key={`${tab}-${version}`}>
        <Active />
      </div>
      <hr />
      <button className="btn small" onClick={reset}>Restablecer datos de demostración</button>
    </>
  )
}

export function AdminPage() {
  return (
    <AdminGate>
      <Panel />
    </AdminGate>
  )
}
