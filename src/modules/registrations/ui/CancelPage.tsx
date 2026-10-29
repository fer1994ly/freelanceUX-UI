import { useParams } from 'react-router-dom'
import { useApp } from '../../../shared/ui/AppContext'
import { useAsync } from '../../../shared/ui/useAsync'
import { RegistrationStatus } from './RegistrationStatus'

export function CancelPage() {
  const { token = '' } = useParams()
  const app = useApp()
  const { data, loading, reload } = useAsync(() => app.registrations.findByCancelToken(token), token)
  if (loading) return <p>Cargando…</p>
  if (!data) return <p className="notice">No encontramos esta inscripción. Revisa el enlace.</p>
  return (
    <>
      <h1>Tu inscripción</h1>
      <RegistrationStatus view={data} mode="manage" onChanged={reload} />
    </>
  )
}
