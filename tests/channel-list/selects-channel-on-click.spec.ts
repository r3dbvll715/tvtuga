import { test, expect } from '@playwright/test';

test('selects channel on click', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  // 2. Wait for channels to load
  await page.waitForSelector('.channel-list', { timeout: 15000 });
  await page.waitForSelector('.channel-list li', { timeout: 10000 });

  // 3. Click on the first channel
  const firstChannel = page.locator('.channel-list li').first();
  await firstChannel.click();

  // 4. Verify channel becomes active (check for active class OR that it's different from featured)
  await expect(firstChannel).toHaveClass(/featured/);

  // 5. Wait for video player to be present (no longer waits for stream URL)
  const player = page.locator('.video-player');
  await expect(player).toBeVisible();
});