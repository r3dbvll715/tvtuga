import { test, expect } from '@playwright/test';

test('toggles play and pause', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  // 2. Wait for channels to load
  await page.waitForSelector('.channel-list', { timeout: 15000 });
  await page.waitForSelector('.channel-list li', { timeout: 10000 });

  // 3. Click on the first channel
  const firstChannel = page.locator('.channel-list li').first();
  await firstChannel.click();

  // 4. Wait for player controls to appear (increase timeout for video player initialization)
  await page.waitForSelector('.player-controls', { timeout: 60000 });

  // 5. Click the play button (first control-btn inside the video player)
  const playButton = page.locator('.player-controls .control-btn').first();
  await playButton.click();

  // 6. Verify play button changes to pause icon
  await expect(playButton).toHaveText('⏸');

  // 7. Click the play button again
  await playButton.click();

  // 8. Verify pause button changes back to play icon
  await expect(playButton).toHaveText('▶');
});