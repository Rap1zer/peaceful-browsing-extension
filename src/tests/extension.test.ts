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

// Verify user can navigate between the two pages using 'Edit triggering keywords' button and the back button
test('can navigate between pages', async () => {
  await gotoKeywordsPage();

  // Go back to main page
  const goBackBtn = await page.$('.go-back-btn');
  expect(goBackBtn, 'Go back button not found').not.toBeNull();
  await goBackBtn!.click();
  expect(page.url()).toBe(mainUrl);
})

test('can add new keyword', async () => {
  const newKeyword: string = 'foobar';

  await gotoKeywordsPage();

  await page.fill('#new-keyword-input', newKeyword); // Enter new keyword to input field

  // Click the block keyword button
  const blockKeywordBtn = await page.$('#block-new-keyword-btn');
  expect(blockKeywordBtn, 'Block keyword button not found').not.toBeNull();
  await blockKeywordBtn!.click();

  // Verify the success message appears and is correct
  const blockKeywordMsg = await page.$('#block-new-keyword-msg');
  expect(blockKeywordMsg, 'Block keyword message not found').not.toBeNull();
  expect(await blockKeywordMsg!.textContent()).toBe(`"${newKeyword}" is now blocked`);

  // Verify the keyword has successfully been added to storage
  const hasStoredKeyword = await page.evaluate((newKeyword) => {
    return new Promise<boolean>((resolve) => {
      chrome.storage.local.get("keywords", (data: { keywords?: string[] }) => {
        const keywords: string[] = data.keywords || [];
        resolve(keywords.includes(newKeyword));
      })
    })
  }, newKeyword)
  expect(hasStoredKeyword, 'New keyword not found in local storage').toBe(true);

  await page.waitForLoadState('load');
  await clearAddedKeywords([newKeyword]);
})

async function getIsBlockerPaused(): Promise<boolean> {
  return await page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      chrome.storage.sync.get('isBlockerPaused', (result) => {
        resolve(result.isBlockerPaused ?? false);
      });
    });
  });
}

async function gotoKeywordsPage(): Promise<void> {
  const keywordsBtn = await page.$('#keywords-btn');
  expect(keywordsBtn, 'Keywords button with id "keywords-btn" not found').not.toBeNull();
  await keywordsBtn!.click();
  expect(page.url()).toBe(`chrome-extension://${extensionId}/src/block-keywords.html`);
}

async function clearAddedKeywords(keywordsToRemove: string[]): Promise<void> {
  await page.evaluate((keywordsToRemove) => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.get('keywords', (data) => {
        const keywords: string[] = data.keywords || [];
        // Filter out keywordsToRemove
        const filteredKeywords = keywords.filter(k => !keywordsToRemove.includes(k));
        chrome.storage.local.set({ keywords: filteredKeywords }, () => {
          resolve();
        });
      });
    });
  }, keywordsToRemove);
}
