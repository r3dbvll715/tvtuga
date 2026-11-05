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

  // 5. Verify volume up (🔊) and down (🔇) icon buttons are removed
  const volButtons = page.locator('.player-controls button:has-text("🔊"), .player-controls button:has-text("🔇")');
  await expect(volButtons).toHaveCount(0);

  // 6. Verify volume bar is visible
  const volumeBar = page.locator('.volume-bar');
  const volumeLevel = page.locator('.volume-level');
  await expect(volumeBar).toBeVisible();
  await expect(volumeLevel).toBeVisible();

  // 7. Adjust volume down by clicking on the left side of the volume bar (20%)
  const box = await volumeBar.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.waitForTimeout(100);
    const widthAfterDown = await volumeLevel.evaluate((el: HTMLElement) => parseFloat(el.style.width));

    // 8. Adjust volume up by clicking on the right side of the volume bar (85%)
    await page.mouse.click(box.x + box.width * 0.85, box.y + box.height / 2);
    await page.waitForTimeout(100);
    const widthAfterUp = await volumeLevel.evaluate((el: HTMLElement) => parseFloat(el.style.width));

    expect(widthAfterUp).toBeGreaterThan(widthAfterDown);
  }
});
