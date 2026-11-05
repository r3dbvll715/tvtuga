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

  // 4. Wait for player controls to appear
  await page.waitForSelector('.player-controls', { timeout: 60000 });
  const playButton = page.locator('.player-controls .control-btn').first();

  // 5. Inspect current state and toggle
  const initialText = (await playButton.textContent())?.trim();
  const expectedToggled = initialText === '⏸' ? '▶' : '⏸';

  await playButton.click();
  await expect(playButton).toHaveText(expectedToggled);

  // 6. Toggle back
  await playButton.click();
  await expect(playButton).toHaveText(initialText!);
});
