import { test, expect } from '@playwright/test';

test('filters channels by search', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');

  // 2. Wait for channels to load
  await page.waitForSelector('.channel-list', { timeout: 15000 });
  await page.waitForSelector('.channel-list li', { timeout: 10000 });

  // 3. Count initial channels
  const initialCount = await page.locator('.channel-list li').count();

  // 4. Type in search input (fix typo: Peserrar -> Pesquisar)
  await page.fill('input[placeholder="Pesquisar canais..."]', 'RTP');

  // 5. Verify filtered results
  const filteredCount = await page.locator('.channel-list li').count();
  expect(filteredCount).toBeLessThan(initialCount);
  expect(filteredCount).toBeGreaterThan(0);

  // 6. Clear search
  await page.fill('input[placeholder="Pesquisar canais..."]', '');

  // 7. Verify all channels are shown again
  const clearedCount = await page.locator('.channel-list li').count();
  expect(clearedCount).toBe(initialCount);
});