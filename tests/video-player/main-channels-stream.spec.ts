import { test, expect } from '@playwright/test';

test.describe('Main Portuguese TV Channels Playback', () => {
  test('streams and plays all verified Portuguese generalist and national channels', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');

    // Wait for channels to load
    await page.waitForSelector('.channel-list li', { timeout: 15000 });

    const channelsToTest = [
      'RTP 1',
      'RTP 2',
      'SIC',
      'TVI',
      'SIC Notícias',
      'CNN Portugal',
      'RTP Notícias',
      'ARTV',
      'RTP Açores',
      'RTP Madeira'
    ];

    for (const channelName of channelsToTest) {
      // Find the channel list item containing the channel name
      const channelItem = page.locator('.channel-list li', {
        has: page.locator('.channel-name', { hasText: new RegExp(`^\\s*${channelName}\\s*$`, 'i') })
      }).first();
      await expect(channelItem).toBeVisible({ timeout: 10000 });

      // Click to play
      await channelItem.click();

      // Ensure video element exists
      const video = page.locator('video');
      await expect(video).toBeAttached();

      // Wait for stream to start buffering and playing with valid frame dimensions
      await page.waitForFunction(
        () => {
          const v = document.querySelector('video');
          return v && v.videoWidth > 0 && v.readyState >= 2;
        },
        null,
        { timeout: 25000 }
      );

      // Verify video dimensions and playback
      const videoInfo = await page.evaluate(() => {
        const v = document.querySelector('video');
        return {
          readyState: v?.readyState,
          videoWidth: v?.videoWidth,
          videoHeight: v?.videoHeight,
          paused: v?.paused,
          muted: v?.muted,
          currentTime: v?.currentTime,
          error: v?.error ? { code: v.error.code, message: v.error.message } : null
        };
      });

      console.log(`Channel ${channelName} status:`, videoInfo);

      expect(videoInfo.error).toBeNull();
      expect(videoInfo.readyState).toBeGreaterThanOrEqual(2);
      expect(videoInfo.videoWidth).toBeGreaterThan(0);
      expect(videoInfo.videoHeight).toBeGreaterThan(0);
    }
  });
});
