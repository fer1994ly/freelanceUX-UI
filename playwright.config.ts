import { defineConfig, devices } from '@playwright/test'

// The iPhone 14 profile defaults to WebKit; we keep its viewport/UA/touch
// emulation but run it on Chromium so only one browser needs installing.
const iphone = { ...devices['iPhone 14'], defaultBrowserType: 'chromium' as const }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-pixel', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-iphone', use: iphone },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_ADMIN_PIN: '1234' },
  },
})
