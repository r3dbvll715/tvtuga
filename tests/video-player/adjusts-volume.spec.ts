import { test, expect } from '@playwright/test';

test('adjusts volume up and down', async ({ page }) => {
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
  await page.waitForSelector('.player-controls', { timeout: 15000 });

  const volumeLevel = page.locator('.volume-level');
  await expect(volumeLevel).toBeVisible();

  // Initial volume is 70%
  await expect(volumeLevel).toHaveCSS('width', /.+px/);
  const initialWidth = await volumeLevel.evaluate((el: HTMLElement) => el.style.width);

  // Click volume down button (last control-btn in player-controls)
  const volButtons = page.locator('.player-controls .control-btn');
  const volUpBtn = volButtons.nth(1); // 🔊
  const volDownBtn = volButtons.nth(2); // 🔇

  // Click volume down
  await volDownBtn.click();
  const widthAfterDown = await volumeLevel.evaluate((el: HTMLElement) => parseFloat(el.style.width));

  // Click volume up twice
  await volUpBtn.click();
  await volUpBtn.click();
  const widthAfterUp = await volumeLevel.evaluate((el: HTMLElement) => parseFloat(el.style.width));

  expect(widthAfterUp).toBeGreaterThan(widthAfterDown);
});

