import type { Activity } from '../../modules/activities/domain/activity'

interface Props {
  activities: Activity[]
  value: string
  onChange: (id: string) => void
}

export function ActivityPicker({ activities, value, onChange }: Props) {
  return (
    <div className="field">
      <label htmlFor="activity-picker">Actividad</label>
      <select id="activity-picker" value={value} onChange={(e) => onChange(e.target.value)}>
        {activities.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </select>
    </div>
  )
}
