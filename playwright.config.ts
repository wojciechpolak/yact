import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

const visualMode = process.env.VRT === '1';
const defaultReporter = (
  process.env.CI ? [['github'] as const] : [['list'] as const]
) as ReporterDescription[];
const visualReporter = [...defaultReporter, ['html', { open: 'never' }]] as ReporterDescription[];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  expect: {
    toHaveScreenshot: {
      pathTemplate: '.visual-regression/{testFilePath}/{arg}{ext}',
    },
  },
  reporter: visualMode ? visualReporter : defaultReporter,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
