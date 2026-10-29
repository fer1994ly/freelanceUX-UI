import { expect, test } from '@playwright/test'
import { fillRegistration, openFigmaActivity, submitButton, unlockAdmin } from './helpers'

test('full registration completes in under 60 seconds with QR and cancel link', async ({ page }) => {
  const started = Date.now()
  await page.goto('/')
  await page.getByRole('link', { name: /Ver detalle.*Introducción a la investigación/ }).click()
  await fillRegistration(page, 1)
  await submitButton(page).click()
  await expect(page.getByRole('heading', { name: 'Inscripción confirmada' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Código QR de ingreso' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cancelar mi inscripción' })).toBeVisible()
  expect(Date.now() - started).toBeLessThan(60_000)
})

test('two simultaneous registrations for the last seat: one confirmed, one waitlisted', async ({ context }) => {
  const a = await context.newPage()
  const b = await context.newPage()
  await openFigmaActivity(a)
  await openFigmaActivity(b)
  await expect(a.getByText('1 lugar disponible').first()).toBeVisible()
  await fillRegistration(a, 1, 'race')
  await fillRegistration(b, 2, 'race')
  await Promise.all([submitButton(a).click(), submitButton(b).click()])
  const heading = (p: typeof a) =>
    p.getByRole('heading', { name: /Inscripción confirmada|Estás en lista de espera/ }).first()
  await expect(heading(a)).toBeVisible()
  await expect(heading(b)).toBeVisible()
  const results = [await heading(a).innerText(), await heading(b).innerText()].sort()
  expect(results).toEqual(['Estás en lista de espera', 'Inscripción confirmada'])
})

test('cancelling a seat offers it to the first waitlisted person', async ({ context }) => {
  const a = await context.newPage()
  const b = await context.newPage()
  await openFigmaActivity(a)
  await fillRegistration(a, 1, 'promo')
  await submitButton(a).click()
  await expect(a.getByRole('heading', { name: 'Inscripción confirmada' })).toBeVisible()

  await openFigmaActivity(b)
  await fillRegistration(b, 2, 'promo')
  await submitButton(b).click()
  await expect(b.getByRole('heading', { name: 'Estás en lista de espera' })).toBeVisible()

  await a.getByRole('link', { name: 'Cancelar mi inscripción' }).click()
  await a.getByRole('button', { name: 'Cancelar mi inscripción' }).click()
  await a.getByRole('button', { name: 'Sí, cancelar' }).click()
  await expect(a.getByRole('heading', { name: 'Inscripción cancelada' })).toBeVisible()

  const admin = await context.newPage()
  await unlockAdmin(admin)
  await admin.getByRole('tab', { name: 'Mensajes' }).click()
  await expect(admin.getByRole('row', { name: /Lugar ofrecido.*promo2@example\.com/ })).toBeVisible()
  await admin.getByRole('tab', { name: 'Inscripciones' }).click()
  await expect(admin.getByRole('row', { name: /promo2@example\.com.*Lugar ofrecido/ })).toBeVisible()
})
