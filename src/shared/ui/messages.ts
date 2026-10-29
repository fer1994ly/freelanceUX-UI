const MESSAGES: Record<string, string> = {
  title_required: 'Ingresa un título.',
  capacity_invalid: 'El cupo debe ser un número entero mayor a 0.',
  price_invalid: 'El precio no puede ser negativo.',
  date_invalid: 'La fecha no es válida.',
  date_required: 'Indica la fecha y la hora.',
  name_required: 'Ingresa tu nombre.',
  email_invalid: 'Ingresa un correo electrónico válido.',
  phone_invalid: 'Ingresa un teléfono válido.',
  consent_required: 'Debes aceptar el tratamiento de tus datos para inscribirte.',
  already_registered: 'Ya existe una inscripción con ese correo para esta actividad.',
  registration_closed: 'Las inscripciones para esta actividad están cerradas.',
  activity_not_found: 'No encontramos la actividad.',
  registration_not_found: 'No encontramos la inscripción.',
  not_cancellable: 'Esta inscripción ya no se puede cancelar.',
  offer_expired: 'El plazo para confirmar este lugar venció.',
  offer_invalid: 'Este enlace de confirmación no es válido.',
  token_not_found: 'Código no encontrado.',
  already_checked_in: 'Este código ya fue utilizado: la persona ya ingresó.',
  not_confirmed: 'Solo las inscripciones confirmadas pueden ingresar.',
  rating_invalid: 'Elige una calificación de 1 a 5.',
  comment_too_long: 'El comentario es demasiado largo (máximo 500 caracteres).',
  survey_not_found: 'No encontramos esta encuesta.',
  survey_not_open: 'La encuesta estará disponible a partir de la fecha de la actividad.',
  already_answered: 'Ya respondiste esta encuesta. ¡Gracias!',
}

/** Maps a thrown domain error code to neutral Spanish UI copy. */
export function errorMessage(e: unknown): string {
  const code = e instanceof Error ? ((e as { code?: string }).code ?? e.message) : String(e)
  return MESSAGES[code] ?? 'Ocurrió un error inesperado. Intenta nuevamente.'
}
