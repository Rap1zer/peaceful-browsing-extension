import { test, expect } from './fixtures.js';
import { Page } from '@playwright/test';

interface response {
  success: boolean;
  error?: string;
}

test.describe(() => {
  let mainUrl: string;
  let blockKeywordsUrl: string;

  test.beforeEach(async ({ page, extensionId }) => {
    mainUrl = `chrome-extension://${extensionId}/src/main.html`;
    blockKeywordsUrl = `chrome-extension://${extensionId}/src/block-keywords.html`;
    await page.goto(mainUrl);
  });

  // Verify clicking pause button toggles 'isBlockerPaused' flag and updates the UI accordingly
  test('can pause and unpause', async ({ page }) => {
    // Check that extension is not paused initially
    expect(await getIsBlockerPaused(page)).toBe(false);

    // Click the pause button
    const pauseBtn = await page.$('#pause-blocker-btn');
    expect(pauseBtn, 'Pause button with id "pause-blocker-btn" not found').not.toBeNull();
    await pauseBtn!.click();

    // Re-check the flag after clicking
    expect(await getIsBlockerPaused(page)).toBe(true);

    // Check the pause message
    const pauseMsg = await page.$('#pause-blocker-msg');
    expect(pauseMsg, 'Pause message with id "pause-blocker-msg" not found').not.toBeNull();
    expect(await pauseMsg!.textContent()).toBe('Reload page to see changes');

    // Click again to unpause
    await pauseBtn!.click();

    expect(await getIsBlockerPaused(page)).toBe(false);
    expect(await pauseMsg!.textContent()).toBe('Reload page to see changes');
  });

  // Verify user can navigate between the two pages using 'Edit triggering keywords' button and the back button
  test('can navigate between pages', async ({ page }) => {
    await gotoKeywordsPage(page, blockKeywordsUrl);

    // Go back to main page
    const goBackBtn = await page.$('.go-back-btn');
    expect(goBackBtn, 'Go back button not found').not.toBeNull();
    await goBackBtn!.click();
    expect(page.url()).toBe(mainUrl);
  });

  // Verify user can add new keyword
  test('can add new keyword', async ({ page }) => {
    const newKeyword: string = 'foobar';

    await gotoKeywordsPage(page, blockKeywordsUrl);

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
    const keywordStored = await hasStoredKeyword(page, newKeyword);
    expect(keywordStored, 'New keyword not found in local storage').toBe(true);

    await removeKeywords(page, [newKeyword]); // Reset the local storage
  });

  // Verify user can remove keyword
  test('can remove keyword', async ({ page }) => {
    const keywordToRemove: string = 'cancer';
    await gotoKeywordsPage(page, blockKeywordsUrl);

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
    const keywordStored = await hasStoredKeyword(page, keywordToRemove);
    expect(keywordStored).toBe(false);

    await addKeyword(page, keywordToRemove); // Reset the local storage
  });

  // Verify keyword length validation
  test('keyword length validation', async ({ page }) => {
    await gotoKeywordsPage(page, blockKeywordsUrl);

    // Search for keyword
    await page.locator(`#new-keyword-input`).fill('This input is far far far longer than 50 characters');
    await page.keyboard.press('Enter');

    // Verify the error message appears and is correct
    const blockKeywordMsg = await page.locator('#block-new-keyword-msg');
    expect(blockKeywordMsg, 'Block keyword message not found').not.toBeNull();
    await expect(blockKeywordMsg).toHaveText('Input must be 50 characters or less');
  });

  // Verify user cannot add keyword twice
  test('cannot add keyword twice', async ({ page }) => {
    await gotoKeywordsPage(page, blockKeywordsUrl);

    const keyword: string = 'foobar';
    let response = await addKeyword(page, keyword);
    expect(response.success).toBe(true);

    response = await addKeyword(page, keyword);
    expect(response.success).toBe(false);
    expect(response.error).toBe('"foobar" is already in the list of keywords');

    await removeKeywords(page, [keyword]); // Reset the local storage
  });

  async function getIsBlockerPaused(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        chrome.storage.sync.get('isBlockerPaused', (result) => {
          resolve(result.isBlockerPaused ?? false);
        });
      });
    });
  }

  async function gotoKeywordsPage(page: Page, blockKeywordsUrl: string): Promise<void> {
    const keywordsBtn = await page.$('#keywords-btn');
    expect(keywordsBtn, 'Keywords button with id "keywords-btn" not found').not.toBeNull();
    await keywordsBtn!.click();
    expect(page.url()).toBe(blockKeywordsUrl);
  }

  async function addKeyword(page: Page, newKeyword: string): Promise<response> {
    return await page.evaluate((newKeyword) => {
      return new Promise<response>((resolve) => {
        chrome.runtime.sendMessage(
          { type: "blockKeyword", keyword: newKeyword },
          (response) => resolve(response)
        );
      });
    }, newKeyword);
  }

  async function removeKeywords(page: Page, keywordsToRemove: string[]): Promise<void> {
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

  async function hasStoredKeyword(page: Page, keyword: string): Promise<boolean> {
    return await page.evaluate((keyword) => {
      return new Promise<boolean>((resolve) => {
        chrome.storage.local.get("keywords", (data: { keywords?: string[] }) => {
          const keywords: string[] = data.keywords || [];
          resolve(keywords.includes(keyword));
        });
      });
    }, keyword);
  }
});
