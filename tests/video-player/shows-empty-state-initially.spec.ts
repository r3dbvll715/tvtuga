import { test, expect } from '@playwright/test';

test('shows video player loads correctly', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  // 2. Wait for channels to load
  await page.waitForSelector('.channel-list', { timeout: 15000 });
  await page.waitForSelector('.channel-list li', { timeout: 10000 });

  // 3. Wait for video player to be visible
  await page.waitForSelector('.video-player', { timeout: 15000 });

  // 4. Verify video player is present
  await expect(page.locator('.video-player')).toBeVisible();
});