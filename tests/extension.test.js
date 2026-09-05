import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

test('loaded extension removes ads, guards nested players, and preserves navigation', async () => {
  const profile = await mkdtemp(join(tmpdir(), 'crichd-test-'));
  const extension = resolve('extension');
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });
  try {
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      let body = '<p>Other site</p>';
      if (url.hostname === 'crichd.pk') body = `
        <script>window.earlyPopup = window.open('https://ads.example'); aclib.runPop({});</script>
        <a id="home" href="/sports/soccer-streams">Soccer</a>
        <a id="cricket" href="https://crichd.live/" target="_blank">Cricket</a>
        <a id="ad" href="https://zyyvyfkeydwgv.online/ad/visit.php?al=1">Ad</a>
        <div class="ad-overlay">Advertisement</div>
        <button id="play" onclick="this.textContent='Playing'">Play</button>
        <iframe src="https://playeraio.top/embed2.php?id=spch78"></iframe>`;
      if (url.hostname === 'playeraio.top') body = '<iframe src="https://bhalocast.pro/atofplay.php?v=spch78"></iframe>';
      if (url.hostname === 'bhalocast.pro') body = '<video controls></video>';
      return route.fulfill({ contentType: 'text/html', body });
    });
    const page = await context.newPage();
    await page.goto('https://crichd.pk/test');
    await page.waitForFunction(() => !document.querySelector('#ad'));
    assert.equal(await page.locator('.ad-overlay').count(), 0);
    assert.equal(await page.evaluate(() => window.earlyPopup), null);
    assert.equal(await page.locator('#home').getAttribute('href'), '/sports/soccer-streams');
    assert.equal(await page.locator('#cricket').count(), 1);
    await page.locator('#play').click();
    assert.equal(await page.locator('#play').innerText(), 'Playing');
    await page.evaluate(() => {
      const ad = document.createElement('a');
      ad.id = 'dynamic-ad';
      ad.href = 'https://new-ad.example/ad/visit.php?al=1';
      document.body.append(ad);
      window.adClickAllowed = ad.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    assert.equal(await page.evaluate(() => window.adClickAllowed), false);
    await page.waitForFunction(() => !document.querySelector('#dynamic-ad'));
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = 'https://unknown-ads.example';
      link.target = '_blank';
      document.body.append(link);
      window.externalAllowed = link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    assert.equal(await page.evaluate(() => window.externalAllowed), false);
    const inner = page.frames().find(frame => frame.url().includes('bhalocast.pro'));
    assert.ok(inner, 'nested player frame is retained');
    assert.equal(await inner.evaluate(() => window.open('about:blank')), null);
    assert.equal(await inner.locator('video[controls]').count(), 1);
    assert.equal(context.pages().length, 2, 'no ad tabs opened');

    await page.goto('https://example.com');
    assert.equal(await page.evaluate(() => /\[native code\]/.test(window.open.toString())), true);
    await page.goto('https://playeraio.top/direct');
    assert.equal(await page.evaluate(() => /\[native code\]/.test(window.open.toString())), true);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
