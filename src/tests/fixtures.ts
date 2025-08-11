import path from 'path';
import { test as base, chromium, type BrowserContext } from '@playwright/test';

// Extend Playwright's test to include our extension context and ID
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    // Path to your built extension's "dist" folder
    const extensionPath = process.env.EXT_PATH || path.resolve('./dist');

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium', // needed for MV3 extensions
      headless: process.env.CI ? true : false, // headed locally, headless in CI
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // Wait for the extension service worker to start
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }

    // Extract the extension ID from the service worker URL
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
