import { useState, type FormEvent } from 'react'
import { Field } from '../../shared/ui/Field'
import { fromLocalInput, toLocalInput } from '../../shared/ui/format'
import { errorMessage } from '../../shared/ui/messages'
import type { Activity, ActivityInput } from '../../modules/activities/domain/activity'

interface Props {
  initial?: Activity
  onSave: (input: ActivityInput) => Promise<void>
  onCancel: () => void
}

export function ActivityForm({ initial, onSave, onCancel }: Props) {
  const [v, setV] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    startsAt: toLocalInput(initial?.startsAt ?? null),
    location: initial?.location ?? '',
    capacity: String(initial?.capacity ?? 10),
    priceArs: String(initial?.priceArs ?? 0),
    status: initial?.status ?? 'published',
  })
  const [error, setError] = useState('')
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!v.startsAt) return setError(errorMessage(new Error('date_required')))
    try {
      await onSave({
        title: v.title,
        description: v.description,
        startsAt: fromLocalInput(v.startsAt),
        location: v.location,
        capacity: Number(v.capacity),
        priceArs: Number(v.priceArs),
        status: v.status,
      })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="card stack" noValidate aria-label="Formulario de actividad">
      <h2>{initial ? 'Editar actividad' : 'Nueva actividad'}</h2>
      <Field label="Título" value={v.title} onChange={(e) => set({ title: e.target.value })} />
      <div className="field">
        <label htmlFor="desc">Descripción</label>
        <textarea id="desc" rows={3} value={v.description} onChange={(e) => set({ description: e.target.value })} />
      </div>
      <Field
        label="Fecha y hora"
        type="datetime-local"
        value={v.startsAt}
        onChange={(e) => set({ startsAt: e.target.value })}
        hint={initial && !initial.startsAt ? 'Es una copia: indica la nueva fecha.' : undefined}
      />
      <Field label="Lugar" value={v.location} onChange={(e) => set({ location: e.target.value })} />
      <Field label="Cupo" type="number" inputMode="numeric" min={1} value={v.capacity}
        onChange={(e) => set({ capacity: e.target.value })} />
      <Field label="Precio informativo (ARS)" type="number" inputMode="numeric" min={0} value={v.priceArs}
        onChange={(e) => set({ priceArs: e.target.value })} />
      <div className="field">
        <label htmlFor="status">Estado</label>
        <select id="status" value={v.status} onChange={(e) => set({ status: e.target.value as Activity['status'] })}>
          <option value="published">Publicada</option>
          <option value="draft">Borrador</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="row">
        <button className="btn primary" type="submit">Guardar</button>
        <button className="btn" type="button" onClick={onCancel}>Cerrar</button>
      </div>
    </form>
  )
}
