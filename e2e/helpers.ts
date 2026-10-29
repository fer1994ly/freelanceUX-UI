import { expect, type Page } from '@playwright/test'

export const FIGMA = /Ver detalle.*Taller de prototipado en Figma/

export async function openFigmaActivity(page: Page) {
  await page.goto('/')
  await page.getByRole('link', { name: FIGMA }).click()
  await expect(page.getByRole('heading', { name: 'Taller de prototipado en Figma', level: 1 })).toBeVisible()
}

export async function fillRegistration(page: Page, n: number, tag = 'e2e') {
  await page.getByLabel('Nombre y apellido').fill(`Persona ${tag} ${n}`)
  await page.getByLabel('Correo electrónico').fill(`${tag}${n}@example.com`)
  await page.getByLabel('Teléfono').fill('223 555 0000')
  await page.getByLabel(/Acepto/).check()
}

export const submitButton = (page: Page) => page.getByRole('button', { name: /Inscribirme/ })

export async function unlockAdmin(page: Page) {
  await page.goto('/admin')
  await page.getByLabel('PIN').fill('1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible()
}
