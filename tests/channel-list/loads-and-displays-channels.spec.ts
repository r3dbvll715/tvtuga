import { test, expect } from '@playwright/test';

test('loads and displays channels', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  // 2. Verify page title
  await expect(page).toHaveTitle(/Portugal IPTV/);

  // 3. Verify header shows app name (use heading to avoid footer match)
  await expect(page.getByRole('heading', { name: 'Portugal IPTV' })).toBeVisible();

  // 4. Wait for channels to load
  await page.waitForSelector('.channel-list', { timeout: 15000 });

  // 5. Verify at least one channel is displayed
  const channelItems = page.locator('.channel-list li');
  await expect(channelItems.first()).toBeVisible({ timeout: 10000 });

  // 6. Verify status bar shows channel count
  await expect(page.getByText(/\d+ canais/)).toBeVisible();
});