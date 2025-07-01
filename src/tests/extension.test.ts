import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { test, expect } from '@playwright/test';
import path from 'path';

let context: BrowserContext;
let page: Page;

const extensionPath = path.resolve('./dist');
const userDataDir = './src/tests/tmp-profile';
const extensionId = 'khhfdlfbbkmlppmcalhncemigmebjjjp';
const mainUrl = `chrome-extension://${extensionId}/src/main.html`;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  page = await context.newPage();
  await page.goto(mainUrl);
});

test.afterAll(async () => {
  await context.close();
});

// Verify clicking pause button toggles 'isBlockerPaused' flag and updates the UI accordingly
test('can pause and unpause', async () => {
  // Check that extension is not paused initially
  expect(await getIsBlockerPaused()).toBe(false);

  // Click the pause button
  const pauseBtn = await page.$('#pause-blocker-btn');
  expect(pauseBtn, 'Pause button with id "pause-blocker-btn" not found').not.toBeNull();
  await pauseBtn!.click();

  // Re-check the flag after clicking
  expect(await getIsBlockerPaused()).toBe(true);

  // Check the pause message
  const pauseMsg = await page.$('#pause-blocker-msg');
  expect(pauseMsg, 'Pause message with id "pause-blocker-msg" not found').not.toBeNull();
  expect(await pauseMsg!.textContent()).toBe('Reload page to see changes');

  // Click again to unpause
  await pauseBtn!.click();

  expect(await getIsBlockerPaused()).toBe(false);
  expect(await pauseMsg!.textContent()).toBe('Reload page to see changes');
});

async function getIsBlockerPaused(): Promise<boolean> {
  return await page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      chrome.storage.sync.get('isBlockerPaused', (result) => {
        resolve(result.isBlockerPaused ?? false);
      });
    });
  });
}
