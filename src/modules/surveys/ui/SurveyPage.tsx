import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../../../shared/ui/AppContext'
import { errorMessage } from '../../../shared/ui/messages'
import { useAsync } from '../../../shared/ui/useAsync'

export function SurveyPage() {
  const { token = '' } = useParams()
  const app = useApp()
  const { data, loading, reload } = useAsync(() => app.surveys.getForm(token), token)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [thanks, setThanks] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await app.surveys.submit(token, { rating, comment })
      setThanks(true)
      reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (loading) return <p>Cargando…</p>
  if (!data) return <p className="notice">{errorMessage(new Error('survey_not_found'))}</p>
  if (thanks) return <p className="notice" role="status">¡Gracias por tu opinión!</p>
  if (data.answered) return <p className="notice">{errorMessage(new Error('already_answered'))}</p>
  if (!data.open) return <p className="notice">{errorMessage(new Error('survey_not_open'))}</p>

  return (
    <form onSubmit={submit} className="card stack" noValidate>
      <h1>Encuesta: {data.activity.title}</h1>
      <fieldset className="stars">
        <legend>¿Cómo calificas la actividad?</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="star">
            <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
            <span>{n}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="comment">Comentario (opcional)</label>
        <textarea id="comment" rows={4} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button className="btn primary" type="submit">Enviar respuesta</button>
    </form>
  )
}
