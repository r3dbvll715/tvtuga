import { test, expect } from '@playwright/test';

test('filters channels by category', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  // 2. Wait for channels to load
  await page.waitForSelector('.channel-list', { timeout: 15000 });
  await page.waitForSelector('.channel-list li', { timeout: 10000 });

  // 3. Count initial channels
  const initialCount = await page.locator('.channel-list li').count();

  // 4. Click on a category filter tab (not "Todas")
  const categoryTabs = page.locator('.filter-tabs button');
  const tabCount = await categoryTabs.count();

  if (tabCount > 1) {
    await categoryTabs.nth(1).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // 5. Verify filtered results
    const filteredCount = await page.locator('.channel-list li').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  }
});