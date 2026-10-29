# Guía de uso del panel

Esta guía explica cómo el estudio gestiona talleres y eventos con la aplicación.

## Acceso

1. Entra a `/admin` (enlace "Administración" en la parte superior).
2. Escribe el PIN. El PIN se define en la variable `VITE_ADMIN_PIN` al publicar el sitio.
3. Importante: el PIN es una barrera básica, no seguridad real. No lo compartas y cámbialo si sospechas que se conoce.

## Crear y duplicar actividades

- Pestaña **Actividades** > **Nueva actividad**: completa título, descripción, fecha y hora, lugar, cupo y precio informativo (en pesos; no se cobra nada desde la aplicación).
- **Duplicar** copia todo menos la fecha y las inscripciones. La copia queda sin fecha ("Fecha a definir") y no aparece en el listado público hasta que le asignes una con **Editar**.
- El estado **Borrador** o **Cancelada** oculta la actividad del público y cierra las inscripciones.

## Inscripciones y lista de espera

- El público ve solo las actividades futuras, ordenadas por fecha, con los lugares disponibles.
- Al inscribirse, la persona recibe en pantalla su confirmación con un código QR y un enlace para cancelar.
- Si no quedan lugares, queda en **lista de espera** y ve su posición.
- Cuando alguien cancela, el primero de la lista recibe una **oferta de lugar válida por 24 horas**. Debe confirmarla desde su enlace. Si no responde a tiempo, la oferta vence y pasa a la siguiente persona. El vencimiento se aplica automáticamente cuando se abre la actividad o el panel.
- En la pestaña **Inscripciones** puedes ver confirmados, lista de espera y ofertas, y cancelar una inscripción si hace falta.

## Mensajes

La aplicación **no envía correos**. La pestaña **Mensajes** muestra lo que se enviaría (confirmación, lista de espera, lugar ofrecido, cancelación). Puedes copiar el enlace de una oferta y avisar a la persona por tu canal habitual. El envío real de correos se conectará más adelante.

## Ingreso el día del evento

1. Abre la pestaña **Ingreso** desde un celular o tablet.
2. Pulsa **Escanear con cámara** y apunta al QR de la persona (acepta el permiso de cámara). Si la cámara no funciona, escribe el código que aparece debajo del QR y pulsa **Registrar ingreso**.
3. Cada código sirve una sola vez: un segundo intento muestra "ya fue utilizado". Solo las inscripciones confirmadas pueden ingresar.
4. También puedes marcar o quitar el ingreso a mano en la pestaña **Inscripciones**.

## Exportar

En **Inscripciones**, elige la actividad y pulsa **Exportar CSV**. El archivo abre bien en Excel (UTF-8) e incluye una fila por persona con la lista (confirmados o lista de espera), el estado, los datos de contacto, la posición en la lista y la hora de ingreso.

## Encuesta posterior

A partir de la fecha de la actividad, las personas confirmadas pueden responder una encuesta breve (calificación de 1 a 5 y comentario opcional) desde el enlace que ven en su página de inscripción. Solo se admite una respuesta por inscripción. Los resultados están en la pestaña **Encuestas**.

## Datos de demostración

Al abrir la aplicación por primera vez se cargan actividades de ejemplo. El botón **Restablecer datos de demostración** borra todo lo guardado en este navegador y vuelve a cargarlas. Úsalo solo para pruebas.

## Limitaciones

- Los datos se guardan **solo en el navegador** donde se usa la aplicación. El panel y el público comparten información únicamente si usan el mismo navegador; en otro dispositivo no se verán las mismas inscripciones.
- Por eso, por ahora la aplicación sirve para una demostración o para gestionar un evento desde un único dispositivo (por ejemplo, la tablet de recepción). Para uso real con público desde sus propios dispositivos hace falta conectar una base de datos compartida.
- Si se borran los datos del navegador, se pierden las inscripciones. Exporta el CSV con frecuencia.
- No hay envío de correos ni cobros.
