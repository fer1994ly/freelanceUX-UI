import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { fillRegistration, openFigmaActivity, submitButton, unlockAdmin } from './helpers'

test('a QR token can be used only once at check-in (manual code entry)', async ({ context }) => {
  const visitor = await context.newPage()
  await openFigmaActivity(visitor)
  await fillRegistration(visitor, 1, 'qr')
  await submitButton(visitor).click()
  await expect(visitor.getByRole('heading', { name: 'Inscripción confirmada' })).toBeVisible()
  const code = (await visitor.locator('.code').innerText()).trim()

  const admin = await context.newPage()
  await unlockAdmin(admin)
  await admin.getByRole('tab', { name: 'Ingreso' }).click()
  await admin.getByLabel('Código de ingreso').fill(code)
  await admin.getByRole('button', { name: 'Registrar ingreso' }).click()
  await expect(admin.getByText(/Ingreso registrado: Persona qr 1/)).toBeVisible()

  await admin.getByLabel('Código de ingreso').fill(code)
  await admin.getByRole('button', { name: 'Registrar ingreso' }).click()
  await expect(admin.getByRole('alert')).toContainText('ya fue utilizado')
})

test('duplicating an activity leaves the date empty', async ({ page }) => {
  await unlockAdmin(page)
  const before = await page.getByRole('row').count()
  await page
    .getByRole('row', { name: /Taller de prototipado en Figma/ })
    .getByRole('button', { name: /Duplicar/ })
    .click()
  await expect(page.getByLabel('Fecha y hora')).toHaveValue('')
  await expect(page.getByText('Es una copia: indica la nueva fecha.')).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.getByRole('row')).toHaveCount(before + 1)
  await expect(page.getByRole('row', { name: /Fecha a definir/ })).toBeVisible()
})

test('CSV export contains registrants, waitlist and attendance', async ({ context }) => {
  for (const n of [1, 2]) {
    const p = await context.newPage()
    await openFigmaActivity(p)
    await fillRegistration(p, n, 'csv')
    await submitButton(p).click()
    await expect(p.getByRole('heading', { name: /Inscripción confirmada|Estás en lista de espera/ })).toBeVisible()
    await p.close()
  }
  const admin = await context.newPage()
  await unlockAdmin(admin)
  await admin.getByRole('tab', { name: 'Inscripciones' }).click()
  await admin.getByRole('button', { name: /Marcar ingreso Persona csv 1/ }).click()
  await expect(admin.getByRole('button', { name: /Quitar ingreso Persona csv 1/ })).toBeVisible()
  const [download] = await Promise.all([
    admin.waitForEvent('download'),
    admin.getByRole('button', { name: 'Exportar CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/taller-de-prototipado-en-figma-.*\.csv/)
  const text = await readFile((await download.path())!, 'utf8')
  expect(text.charCodeAt(0)).toBe(0xfeff)
  expect(text).toContain('list,status,name,email,phone,registeredAt,waitlistPosition,checkedInAt')
  expect(text).toMatch(/registrants,confirmed,Persona csv 1,csv1@example\.com,.*Z,,.*Z/)
  expect(text).toMatch(/waitlist,waitlisted,Persona csv 2,csv2@example\.com,.*Z,1,/)
  expect(text).toContain('registrants,confirmed,Ana')
})
