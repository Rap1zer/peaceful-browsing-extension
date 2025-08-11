import { chromium } from 'playwright';
import type { BrowserContext, Page } from 'playwright';
import { test, expect } from '@playwright/test';
import path from 'path';

let context: BrowserContext;
let page: Page;

const extensionPath = process.env.EXT_PATH || path.resolve('./dist');
const userDataDir = './src/tests/tmp-profile';
const mainUrl = `chrome-extension://khhfdlfbbkmlppmcalhncemigmebjjjp/src/main.html`;
const blockKeywordsUrl = `chrome-extension://khhfdlfbbkmlppmcalhncemigmebjjjp/src/block-keywords.html`;

interface response {
  success: boolean;
  error?: string;
}

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

test.afterEach(async () => {
  await page.goto(mainUrl);
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
});

// Verify user can add new keyword
test('can add new keyword', async () => {
  const newKeyword: string = 'foobar';

  await gotoKeywordsPage();

  await page.fill('#new-keyword-input', newKeyword); // Enter new keyword to input field

  // Click the block keyword button
  const blockKeywordBtn = await page.$('#block-new-keyword-btn');
  expect(blockKeywordBtn, 'Block keyword button not found').not.toBeNull();
  await blockKeywordBtn!.click();

  // Verify the success message appears and is correct
  const blockKeywordMsg = await page.locator('#block-new-keyword-msg');
  expect(blockKeywordMsg, 'Block keyword message not found').not.toBeNull();
  await expect(blockKeywordMsg).toHaveText(`"${newKeyword}" is now blocked`);

  // Verify the keyword has successfully been added to storage
  const keywordStored = await hasStoredKeyword(newKeyword);
  expect(keywordStored, 'New keyword not found in local storage').toBe(true);

  await removeKeywords([newKeyword]); // Reset the local storage
});

// Verify user can remove keyword
test('can remove keyword', async () => {
  const keywordToRemove: string = 'cancer';
  await gotoKeywordsPage();

  // Search for keyword
  await page.locator(`#keyword-search-input`).fill(keywordToRemove);
  await page.keyboard.press('Enter');

  // Wait for the keyword to appear in the list
  await page.waitForSelector('.block-keyword-item');

  // Click the remove keyword button
  const removeKeywordBtn = await page.$(`#${keywordToRemove}-keyword-item`);
  expect(removeKeywordBtn, 'Button to remove keyword not found').not.toBeNull();
  await removeKeywordBtn!.click();

  // Verify the keyword has been successfully removed
  const keywordStored = await hasStoredKeyword(keywordToRemove);
  expect(keywordStored).toBe(false);

  await addKeyword(keywordToRemove); // Reset the local storage
});

// Verify keyword length validation
test('keyword length validation', async () => {
  await gotoKeywordsPage();

  // Search for keyword
  await page.locator(`#new-keyword-input`).fill('This input is far far far longer than 50 characters');
  await page.keyboard.press('Enter');

  // Verify the error message appears and is correct
  const blockKeywordMsg = await page.locator('#block-new-keyword-msg');
  expect(blockKeywordMsg, 'Block keyword message not found').not.toBeNull();
  await expect(blockKeywordMsg).toHaveText('Input must be 50 characters or less');
});

// Verify user cannot add keyword twice
test('cannot add keyword twice', async () => {
  await gotoKeywordsPage();

  const keyword: string = 'foobar';
  let response = await addKeyword(keyword);
  expect(response.success).toBe(true);

  response = await addKeyword(keyword);
  expect(response.success).toBe(false);
  expect(response.error).toBe('"foobar" is already in the list of keywords');

  await removeKeywords([keyword]); // Reset the local storage
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

async function gotoKeywordsPage(): Promise<void> {
  const keywordsBtn = await page.$('#keywords-btn');  
  expect(keywordsBtn, 'Keywords button with id "keywords-btn" not found').not.toBeNull();
  await keywordsBtn!.click();
  expect(page.url()).toBe(blockKeywordsUrl);
}

async function addKeyword(newKeyword: string): Promise<response> {
  return await page.evaluate((newKeyword) => {
    return new Promise<response>((resolve) => {
      chrome.runtime.sendMessage(
        { type: "blockKeyword", keyword: newKeyword },
        (response) => resolve(response)
      );
    });
  }, newKeyword);
}


async function removeKeywords(keywordsToRemove: string[]): Promise<void> {
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

async function hasStoredKeyword(keyword: string): Promise<Boolean> {
  return await page.evaluate((keyword) => {
    return new Promise<boolean>((resolve) => {
      chrome.storage.local.get("keywords", (data: { keywords?: string[] }) => {
        const keywords: string[] = data.keywords || [];
        resolve(keywords.includes(keyword));
      })
    })
  }, keyword)
}