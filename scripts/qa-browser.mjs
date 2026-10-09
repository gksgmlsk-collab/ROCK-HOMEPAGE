import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDirectory = fileURLToPath(new URL('../artifacts/', import.meta.url));
const report = {
  generatedAt: new Date().toISOString(), baseUrl, checks: [], appInventories: {},
  responsive: [], screenshots: [], consoleErrors: [], pageErrors: [], httpErrors: [], failedRequests: [],
};
const areas = [
  { id: 'student', label: '학생지원', count: 10 },
  { id: 'safety', label: '학교안전', count: 5 },
  { id: 'admin', label: '학교행정', count: 8 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.QA_BROWSER_PATH ??
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});

function watchPage(page, label) {
  page.setDefaultTimeout(10_000);
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      report.consoleErrors.push({ label, text: message.text() });
    }
  });
  page.on('pageerror', (error) => report.pageErrors.push({ label, text: error.message }));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      report.httpErrors.push({ label, url: response.url(), status: response.status() });
    }
  });
  page.on('requestfailed', (request) => {
    const error = request.failure()?.errorText ?? 'unknown';
    // Closing a video or leaving its view intentionally cancels media downloads.
    if (error === 'net::ERR_ABORTED' &&
      (request.resourceType() === 'media' || request.url().startsWith('blob:') ||
        (request.url().startsWith(`${baseUrl}/generated/`) && /\.(mp4|webm)(\?|$)/.test(request.url())))) return;
    report.failedRequests.push({ label, url: request.url(), error });
  });
}

async function check(name, page, run) {
  try {
    await run();
    report.checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, passed: false, error: error.stack ?? String(error) });
    console.log(`FAIL ${name}: ${error.message}`);
    await page.screenshot({ path: join(outputDirectory, `qa-failure-${report.checks.length}.png`) })
      .catch(() => {});
  }
}

async function screenshot(page, name, fullPage = false) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = [...document.images].filter((img) => {
      const bounds = img.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < innerHeight &&
        bounds.right > 0 && bounds.left < innerWidth;
    });
    // A lazy image clipped by a rail or hidden behind a dialog may not start a
    // request. It must never hold up a screenshot of the currently visible UI.
    await Promise.race([
      Promise.all(visibleImages.map((img) => img.decode().catch(() => {}))),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  });
  await page.screenshot({ path: join(outputDirectory, name), fullPage });
  report.screenshots.push(name);
}

async function openRoute(page, route) {
  const url = new URL(route, `${baseUrl}/`).href;
  // Each scenario starts fresh even if the preceding one used the same route.
  if (page.url() === url) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForRoute(page, route);
}

async function waitForRoute(page, route) {
  await page.waitForFunction((hash) => window.location.hash === hash, route);
  if (route === '#/intro' || route === '#journey-start') {
    await page.locator('.intro-site').waitFor({ state: 'visible' });
    assert.equal(await page.locator('main').count(), 1, 'one main landmark');
    assert.equal(await page.locator('.scroll-world, .reduced-world').count(), 1,
      'the introduction has one motion-aware experience');
    assert.equal(await page.locator('.app-workspace, .about-workspace, .site-header').count(), 0,
      'the introduction does not mount the homepage behind it');
    return;
  }
  const area = route === '#/apps' ? 'all' : route.split('/')[2];
  const selector = route.startsWith('#/apps')
    ? `.app-workspace[data-area="${area}"]`
    : `.about-workspace[data-section="${area ?? 'intro'}"]`;
  await page.locator(selector).waitFor({ state: 'visible' });
  assert.equal(await page.locator('main').count(), 1, 'one main landmark');
  assert.equal(await page.locator('.app-workspace, .about-workspace').count(), 1,
    'only the selected workspace is mounted');
  assert.equal(await page.locator('.scroll-world').count(), 0,
    'the scroll introduction is absent from ordinary homepage navigation');
  assert.equal(await page.locator('.site-header').getAttribute('data-theme'), null,
    'all homepage views share the original ivory and green header');
}

function menuButton(page, label) {
  return page.locator('.site-header__nav').getByRole('button', { name: label, exact: true });
}

async function openMenu(page, label) {
  const button = menuButton(page, label);
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  const panelId = await button.getAttribute('aria-controls');
  assert.ok(panelId, 'menu declares its controlled panel');
  const panel = page.locator(`[id="${panelId}"]`);
  await panel.waitFor({ state: 'visible' });
  return panel;
}

async function chooseArea(page, area) {
  const panel = await openMenu(page, '전체 앱');
  await panel.getByRole('link', { name: area.label, exact: false }).click();
  await waitForRoute(page, `#/apps/${area.id}`);
  assert.equal(await menuButton(page, '전체 앱').getAttribute('aria-expanded'), 'false');
}

async function verifyExternalLinks(page) {
  const unsafe = await page.locator('a').evaluateAll((links) => links
    .filter((link) => link.protocol === 'javascript:' ||
      (link.target === '_blank' && !link.rel.split(/\s+/).includes('noopener')))
    .map((link) => ({ text: link.textContent, href: link.href, rel: link.rel })));
  assert.deepEqual(unsafe, [], 'external links use safe protocols and opener isolation');
}

async function verifyAwardEvidence(page) {
  const expected = [
    { id: 'data-rock', issuer: '교육부장관상', prize: '일반부 대상', competition: '제8회 교육 공공데이터 AI 활용대회',
      stats: ['242교', '20종', '67.4%'], report: 'https://lab-tq11.onrender.com/bangyeong.html',
      service: 'https://park-analysis-web-production.up.railway.app/' },
    { id: 'dolsoe-award', issuer: '법제처장상', prize: '전국 최우수상', competition: '제2회 법령데이터 활용 아이디어 공모전',
      stats: ['약 400개', '10개', '6 → 1위'], report: 'https://lab-tq11.onrender.com/dolsoe.html',
      service: 'https://schoollaw-review-production.up.railway.app/web/' },
  ];
  assert.equal(await page.locator('.about-award[data-award]').count(), 2);
  for (const award of expected) {
    const card = page.locator(`.about-award[data-award="${award.id}"]`);
    const text = (await card.innerText()).replace(/\s+/g, ' ');
    for (const preserved of [award.issuer, award.prize, award.competition, ...award.stats]) {
      assert.ok(text.includes(preserved), `${award.id} retains ${preserved}`);
    }
    assert.equal(await card.locator(`a[href="${award.report}"]`).count() >= 1, true);
    assert.equal(await card.locator(`a[href="${award.service}"]`).count(), 1);
    assert.ok(await card.locator('img').count() >= 1, 'each award keeps its supporting image');
    for (const image of await card.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(node => node.decode());
      assert.ok(await image.evaluate(node => node.naturalWidth > 0));
    }
  }
  await page.locator('.about-awards h1').scrollIntoViewIfNeeded();
  await verifyExternalLinks(page);
}

async function collectCards(page) {
  const result = [];
  for (let pageNumber = 0; pageNumber < 4; pageNumber += 1) {
    const cards = await page.locator('.app-card').evaluateAll((elements) => elements.map((card) => ({
      id: card.getAttribute('data-project'), category: card.getAttribute('data-category'), text: card.textContent,
    })));
    assert.ok(cards.length <= 6, 'the page keeps the app list compact');
    result.push(...cards);
    const next = page.getByRole('button', { name: '다음 앱 목록', exact: true });
    if (await next.count() === 0 || !(await next.isEnabled())) break;
    const previousFirst = cards[0]?.id;
    await next.click();
    await page.waitForFunction((id) =>
      document.querySelector('.app-card')?.getAttribute('data-project') !== id, previousFirst);
  }
  assert.equal(new Set(result.map((card) => card.id)).size, result.length,
    'pagination does not repeat apps');
  return result;
}

async function verifyDialogKeyboard(page, dialog, opener) {
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true,
    'opening a dialog moves keyboard focus inside');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true,
    'reverse tab keeps focus inside the dialog');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await opener.evaluate((node) => node === document.activeElement), true,
    'closing the dialog restores its opener');
}

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  });
  const desktop = await desktopContext.newPage();
  watchPage(desktop, 'desktop');

  await check('bare URL starts with only the animated scroll introduction', desktop, async () => {
    await desktop.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await desktop.locator('.intro-site .scroll-world').waitFor();
    assert.equal(new URL(desktop.url()).hash, '');
    assert.equal(await desktop.locator('.app-workspace, .about-workspace, .site-header').count(), 0);
    assert.equal(await desktop.locator('main').count(), 1);
    assert.equal(await desktop.locator('main h1').count(), 1);
    assert.equal(await desktop.locator('.world-film[data-source-variant="desktop"]').count(), 1);
    assert.equal(await desktop.locator('.intro-entry__button').count(), 0,
      'the final entry button appears at the end of the journey');
    const shortcut = desktop.getByRole('link', { name: '홈페이지 바로가기', exact: false });
    assert.equal(await shortcut.count(), 1);
    assert.equal(await desktop.getByText('소개 건너뛰기', { exact: true }).count(), 0);
    const shortcutStyle = await shortcut.evaluate(node => {
      const style = getComputedStyle(node);
      return { height: node.getBoundingClientRect().height, fontSize: Number.parseFloat(style.fontSize), background: style.backgroundColor };
    });
    assert.ok(shortcutStyle.height >= 58 && shortcutStyle.fontSize >= 17,
      'the desktop homepage shortcut has a large readable touch target');
    const shortcutBackground = shortcutStyle.background.match(/[\d.]+/g)?.map(Number) ?? [];
    assert.ok(shortcutBackground.length >= 3 && shortcutBackground.slice(0, 3).every(channel => channel >= 240) &&
      (shortcutBackground[3] === undefined || shortcutBackground[3] >= .9),
    'the homepage shortcut uses the requested white background');
    await screenshot(desktop, 'desktop-intro-start.png');
  });

  await check('the final scroll scene offers a working homepage entry', desktop, async () => {
    await desktop.locator('.intro-main').focus();
    await desktop.keyboard.press('End');
    const enter = desktop.getByRole('link', { name: '홈페이지 들어가기', exact: false });
    await enter.waitFor({ state: 'visible', timeout: 30_000 });
    assert.equal(await enter.getAttribute('href'), '#/about');
    const bounds = await enter.boundingBox();
    assert.ok(bounds && bounds.width >= 180 && bounds.height >= 44);
    assert.equal(await desktop.locator('.end-sequence .end-brand').count(), 1);
    await screenshot(desktop, 'desktop-intro-end.png');
    await enter.click();
    await waitForRoute(desktop, '#/about');
    assert.equal(await desktop.evaluate(() => scrollY), 0,
      'entering the homepage starts at its top');
  });

  await check('homepage introduction keeps the two top-level menus', desktop, async () => {
    await openRoute(desktop, '#/about');
    const labels = await desktop.locator('.site-header__nav button[aria-expanded]').allTextContents();
    assert.deepEqual(labels.map((label) => label.trim()), ['연구소 소개', '전체 앱']);
    assert.equal(await desktop.locator('.app-workspace, .about-awards, .about-organization, .scroll-world').count(), 0);
    assert.equal(await desktop.locator('main h1').count(), 1);
    await verifyExternalLinks(desktop);
    await screenshot(desktop, 'desktop-start.png');
  });

  await check('intro replay, homepage shortcut, browser history, and legacy entry remain usable', desktop, async () => {
    await desktop.getByRole('link', { name: '처음 소개영상 다시보기', exact: false }).click();
    await waitForRoute(desktop, '#/intro');
    await desktop.getByRole('link', { name: '홈페이지 바로가기', exact: false }).click();
    await waitForRoute(desktop, '#/about');
    await desktop.goBack();
    await waitForRoute(desktop, '#/intro');
    await desktop.goForward();
    await waitForRoute(desktop, '#/about');
    await openRoute(desktop, '#journey-start');
    await desktop.getByRole('link', { name: '홈페이지 바로가기', exact: false }).click();
    await waitForRoute(desktop, '#/about');
  });

  await check('dropdown menus open, select, and dismiss accessibly', desktop, async () => {
    const aboutPanel = await openMenu(desktop, '연구소 소개');
    for (const label of ['연구소 소개', '연구소 수상', '운영조직']) {
      assert.equal(await aboutPanel.getByRole('link', { name: label, exact: false }).count(), 1);
    }
    const appsPanel = await openMenu(desktop, '전체 앱');
    assert.equal(await menuButton(desktop, '연구소 소개').getAttribute('aria-expanded'), 'false');
    for (const area of areas) {
      assert.equal(await appsPanel.getByRole('link', { name: area.label, exact: false }).count(), 1);
    }
    await screenshot(desktop, 'desktop-app-menu.png');
    await desktop.keyboard.press('Escape');
    assert.equal(await menuButton(desktop, '전체 앱').getAttribute('aria-expanded'), 'false');
    assert.equal(await menuButton(desktop, '전체 앱').evaluate((node) => node === document.activeElement), true);
    await openMenu(desktop, '전체 앱');
    await desktop.locator('main h1').click();
    assert.equal(await menuButton(desktop, '전체 앱').getAttribute('aria-expanded'), 'false');
    await openMenu(desktop, '전체 앱');
    await desktop.locator('main').focus();
    assert.equal(await menuButton(desktop, '전체 앱').getAttribute('aria-expanded'), 'false');
    await menuButton(desktop, '전체 앱').focus();
    await desktop.keyboard.press('ArrowDown');
    assert.equal(await desktop.locator('#nav-panel-apps .site-menu-grid a').first()
      .evaluate(node => node === document.activeElement), true,
    'ArrowDown opens the menu and focuses its first destination');
    await desktop.keyboard.press('Escape');
    assert.equal(await menuButton(desktop, '전체 앱').evaluate(node => node === document.activeElement), true);
    for (const area of areas) await chooseArea(desktop, area);
  });

  await check('direct links, reload, and browser history preserve the selected view', desktop, async () => {
    await openRoute(desktop, '#/apps/student');
    await desktop.reload({ waitUntil: 'domcontentloaded' });
    await waitForRoute(desktop, '#/apps/student');
    await chooseArea(desktop, areas[1]);
    await desktop.goBack();
    await waitForRoute(desktop, '#/apps/student');
    await desktop.goForward();
    await waitForRoute(desktop, '#/apps/safety');
    await openRoute(desktop, '#/about/awards');
    await desktop.reload({ waitUntil: 'domcontentloaded' });
    await waitForRoute(desktop, '#/about/awards');
  });

  await check('all-app overview offers three domains without a 23-app wall', desktop, async () => {
    await openRoute(desktop, '#/apps');
    assert.equal(await desktop.locator('.app-domain-tile[data-area]').count(), 3);
    assert.equal(await desktop.locator('.app-card').count(), 0);
    await verifyExternalLinks(desktop);
    await screenshot(desktop, 'desktop-app-overview.png');
  });

  for (const area of areas) {
    await check(`${area.label}: complete inventory and owner visibility`, desktop, async () => {
      await openRoute(desktop, `#/apps/${area.id}`);
      if (area.id !== 'safety') await screenshot(desktop, `desktop-${area.id}.png`);
      const cards = await collectCards(desktop);
      assert.equal(cards.length, area.count);
      assert.ok(cards.every((card) => card.category === area.label));
      assert.ok(cards.filter((card) => card.id !== 'draconis').every((card) =>
        !/담당|조미진|김한일|박동훈|한희나|이창성|이남건|박주현/.test(card.text)),
      'other app cards omit owner names');
      if (area.id === 'student') {
        assert.match(cards.find((card) => card.id === 'draconis')?.text ?? '', /조미진/);
      }
      report.appInventories[area.id] = cards.map(({ id }) => id);
      await verifyExternalLinks(desktop);
    });
  }

  await check('representative apps show large, visible preview images', desktop, async () => {
    for (const area of areas) {
      await openRoute(desktop, `#/apps/${area.id}`);
      const images = desktop.locator('.app-feature__image img');
      assert.equal(await images.count(), area.id === 'admin' ? 2 : 1);
      for (const image of await images.all()) {
        await image.evaluate((node) => node.decode());
        const dimensions = await image.locator('..').boundingBox();
        assert.ok(dimensions && dimensions.width >= 420 && dimensions.height >= 220,
          `${area.label} representative media frame has a readable desktop size`);
        const imageBounds = await image.boundingBox();
        assert.ok(imageBounds && imageBounds.width >= 320 && imageBounds.height >= 120,
          'the image remains visible inside its large media frame');
      }
      if (area.id === 'student') {
        assert.match(await images.first().getAttribute('src'), /draconis-world-card\.png$/,
          'Draconis uses the illustrated world card as its representative image');
      }
    }
  });

  await check('subgroups and search narrow the selected domain, with a useful empty state', desktop, async () => {
    await openRoute(desktop, '#/apps/student');
    const filters = desktop.getByRole('group', { name: '활용 목적', exact: true });
    await filters.getByRole('button', { name: '교과·프로젝트 학습', exact: false }).click();
    assert.equal(await desktop.locator('.app-card').count(), 4);
    await filters.getByRole('button', { name: '학생생활·학습지원', exact: false }).click();
    assert.equal(await desktop.locator('.app-card').count(), 6);
    await filters.getByRole('button', { name: '전체', exact: false }).click();
    const search = desktop.locator('#app-search');
    await search.fill('DRACONIS');
    assert.equal(await desktop.locator('.app-card').count(), 1);
    assert.equal(await desktop.locator('.app-card').getAttribute('data-project'), 'draconis');
    await search.fill('반경너머');
    assert.equal(await desktop.locator('.app-card').count(), 0,
      'student search does not leak school-safety results');
    await search.fill('존재하지않는앱_qa');
    assert.equal(await desktop.locator('.app-card').count(), 0);
    assert.ok(await desktop.getByText(/(앱이 없|찾지 못|검색 결과가 없)/).count() > 0);
    await desktop.getByRole('button', { name: '검색 지우기', exact: true }).click();
    assert.equal(await search.inputValue(), '');
    assert.equal((await collectCards(desktop)).length, 10);
  });

  await check('Draconis materials stay collapsed until requested and retain their controls', desktop, async () => {
    await openRoute(desktop, '#/apps/student');
    assert.equal(await desktop.locator('.draconis-presentation, .draconis-gallery').count(), 0);
    const presentationToggle = desktop.locator('.app-resources').getByRole('button', { name: '소개 자료', exact: false });
    await presentationToggle.click();
    assert.equal(await presentationToggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await desktop.locator('.draconis-presentation__thumbnails button').count(), 18);
    assert.equal(await desktop.locator('.draconis-presentation a[download]').count(), 1);
    await desktop.getByRole('button', { name: '다음 프레젠테이션 슬라이드', exact: true }).click();
    assert.equal((await desktop.locator('.draconis-presentation__counter').innerText()).trim(), '2 / 18');
    const galleryToggle = desktop.locator('.app-resources').getByRole('button', { name: '학습 화면', exact: false });
    await galleryToggle.click();
    assert.equal(await desktop.locator('.draconis-presentation').count(), 0);
    assert.equal(await desktop.locator('.draconis-gallery__item').count(), 27);
    await galleryToggle.click();
    assert.equal(await desktop.locator('.draconis-gallery').count(), 0);
  });

  await check('Draconis slides and screenshots enlarge, zoom, and retain keyboard access', desktop, async () => {
    await openRoute(desktop, '#/apps/student');
    for (const kind of ['presentation', 'gallery']) {
      const label = kind === 'presentation' ? '소개 자료' : '학습 화면';
      await desktop.locator('.app-resources').getByRole('button', { name: label, exact: false }).click();
      const panel = desktop.locator(`.draconis-${kind}`);
      const introduction = panel.locator(kind === 'presentation'
        ? '.draconis-presentation__copy > p:last-of-type' : '.draconis-gallery__intro');
      assert.ok(await introduction.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize)) >= 16,
        'resource introductions use readable desktop type');
      if (kind === 'gallery') {
        await panel.locator('.draconis-gallery__thumbnail').nth(1).click();
        assert.equal(await desktop.locator('dialog.draconis-image-viewer').count(), 0,
          'selecting a thumbnail updates the large inline preview');
        assert.match(await panel.locator('.draconis-gallery__status').innerText(), /2 \/ 27/);
      }
      const opener = panel.getByRole('button', { name: '화면 확대', exact: false });
      await opener.click();
      const dialog = desktop.locator('dialog.draconis-image-viewer');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await desktop.evaluate(() => document.body.style.overflow), 'hidden');
      const before = await dialog.locator('.draconis-gallery__dialog-count').innerText();
      await desktop.keyboard.press('ArrowRight');
      assert.notEqual(await dialog.locator('.draconis-gallery__dialog-count').innerText(), before,
        'arrow keys move between images in the expanded viewer');
      const viewport = dialog.locator('.draconis-image-viewer__viewport');
      await viewport.locator('img').evaluate(node => node.decode());
      const fitWidth = await viewport.locator('img').evaluate(node => node.getBoundingClientRect().width);
      const zoom = dialog.getByRole('button', { name: '글씨 크게', exact: true });
      await zoom.click();
      assert.equal(await zoom.getAttribute('aria-pressed'), 'true');
      assert.ok(await viewport.locator('img').evaluate(node => node.getBoundingClientRect().width) > fitWidth,
        'reading zoom enlarges the image beyond its fit-to-screen width');
      assert.ok(await viewport.evaluate(node => node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight),
        'enlarged content can be panned inside the viewer');
      const moreZoom = dialog.getByRole('button', { name: '더 크게', exact: true });
      await moreZoom.click();
      assert.equal(await moreZoom.getAttribute('aria-pressed'), 'true');
      await screenshot(desktop, `desktop-draconis-${kind}-zoom.png`);
      await dialog.getByRole('button', { name: '화면 맞춤', exact: true }).click();
      assert.equal(await dialog.locator('.is-zoomed').count(), 0);
      await verifyExternalLinks(desktop);
      await dialog.getByRole('button', { name: kind === 'presentation' ? '프레젠테이션 닫기' : '갤러리 닫기', exact: true }).focus();
      await verifyDialogKeyboard(desktop, dialog, opener);
      assert.notEqual(await desktop.evaluate(() => document.body.style.overflow), 'hidden');
    }
  });

  await check('app details preserve owner rules and accessible keyboard behavior', desktop, async () => {
    await openRoute(desktop, '#/apps/student');
    const card = desktop.locator('.app-card[data-project="draconis"]');
    const opener = card.getByRole('button', { name: 'DRACONIS 드라코니스 자세히 보기', exact: true });
    await opener.click();
    const dialog = desktop.locator('dialog.app-dialog');
    await dialog.waitFor();
    assert.match(await dialog.innerText(), /조미진/);
    assert.doesNotMatch(await dialog.innerText(), /박주현/);
    await verifyExternalLinks(desktop);
    await verifyDialogKeyboard(desktop, dialog, opener);
    await chooseArea(desktop, areas[1]);
    const safetyOpener = desktop.locator('.app-card[data-project="beyond-radius"]')
      .getByRole('button', { name: /자세히 보기/ });
    await safetyOpener.click();
    assert.doesNotMatch(await desktop.locator('dialog.app-dialog').innerText(), /담당|박동훈|김한일|한희나/);
    await desktop.keyboard.press('Escape');
  });

  await check('administration integration advice remains available on demand', desktop, async () => {
    await openRoute(desktop, '#/apps/admin');
    const direction = desktop.locator('.app-admin-direction');
    assert.equal(await direction.getAttribute('open'), null);
    await direction.locator('summary').click();
    assert.equal(await direction.locator('.app-shortcuts a').count(), 4);
    assert.match(await direction.innerText(), /검토/);
    assert.match(await direction.innerText(), /보결관리/);
    assert.match(await direction.innerText(), /정보화기기/);
    await verifyExternalLinks(desktop);
  });

  await check('introduction, awards, and organization have separate views', desktop, async () => {
    await openRoute(desktop, '#/about');
    const sections = [
      { label: '연구소 수상', route: '#/about/awards', selector: '.about-awards' },
      { label: '운영조직', route: '#/about/organization', selector: '.about-organization' },
      { label: '연구소 소개', route: '#/about', selector: '.about-intro' },
    ];
    for (const section of sections) {
      const panel = await openMenu(desktop, '연구소 소개');
      await panel.getByRole('link', { name: section.label, exact: false }).click();
      await waitForRoute(desktop, section.route);
      assert.equal(await desktop.locator(section.selector).count(), 1);
      assert.equal(await desktop.locator('.about-intro, .about-awards, .about-organization').count(), 1);
      if (section.label === '운영조직') {
        assert.match(await desktop.locator(section.selector).innerText(), /조미진|박동훈|김한일/,
          'organizational staff names remain');
      }
      if (section.label === '연구소 수상') await verifyAwardEvidence(desktop);
      await verifyExternalLinks(desktop);
    }
  });

  await check('homepage has a full-width static hero and four working overview cards', desktop, async () => {
    await openRoute(desktop, '#/about');
    assert.equal(await desktop.locator('.about-workspace video, .about-film, .about-film-trigger, .about-ambient__toggle').count(), 0);
    assert.equal(await desktop.getByRole('button', { name: '연구소 영상 보기', exact: true }).count(), 0);
    const hero = desktop.locator('.about-hero');
    const image = hero.locator('img');
    assert.equal(await image.count(), 1);
    assert.equal(await image.getAttribute('src'), '/assets/scene1_dol_ai_lab.png');
    await image.evaluate(node => node.decode());
    const heroBounds = await hero.boundingBox();
    const imageBounds = await image.boundingBox();
    const copyBounds = await hero.locator('.about-hero__copy').boundingBox();
    assert.equal(await hero.locator('.about-hero__glass').count(), 0);
    assert.equal(await desktop.locator('.about-topline, .about-tabs').count(), 0,
      'the homepage avoids duplicating the two top-level navigation menus');
    const shade = hero.locator('.about-hero__shade');
    assert.equal(await shade.count(), 1);
    assert.notEqual(await shade.evaluate(node => getComputedStyle(node).backgroundImage), 'none',
      'the static image has a gradient behind the large introduction copy');
    assert.ok(heroBounds && imageBounds && copyBounds);
    assert.ok(heroBounds.x <= 1 && heroBounds.width >= 1438,
      'the homepage hero stretches across the desktop viewport');
    assert.ok(imageBounds.width >= heroBounds.width * .9 && imageBounds.height >= heroBounds.height * .9,
      'the first-scene image fills the hero behind its text');
    assert.ok(await hero.locator('h1').evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize)) >= 56,
      'the desktop hero uses a prominent headline');
    assert.ok(copyBounds.x >= heroBounds.x - 1 && copyBounds.x < heroBounds.x + heroBounds.width / 2 &&
      copyBounds.x + copyBounds.width <= heroBounds.x + heroBounds.width &&
      copyBounds.y >= imageBounds.y && copyBounds.y < imageBounds.y + imageBounds.height,
    'the introduction copy sits over the left part of the background image');
    const highlights = desktop.locator('.about-highlights');
    assert.equal(await highlights.locator('a[data-highlight]').count(), 4);
    const highlightsBounds = await highlights.boundingBox();
    assert.ok(highlightsBounds && highlightsBounds.y < heroBounds.y + heroBounds.height &&
      highlightsBounds.y + highlightsBounds.height > heroBounds.y + heroBounds.height,
    'the overview cards overlap the lower edge of the hero');
    const primaryLink = hero.getByRole('link', { name: '앱 둘러보기', exact: false });
    await primaryLink.click();
    await waitForRoute(desktop, '#/apps');
    await desktop.goBack();
    await waitForRoute(desktop, '#/about');
    await desktop.locator('.about-hero').getByRole('link', { name: '연구소 수상', exact: false }).click();
    await waitForRoute(desktop, '#/about/awards');
    assert.equal(await desktop.locator('.about-tabs').count(), 1,
      'secondary about navigation remains available on the awards page');
    await desktop.goBack();
    await waitForRoute(desktop, '#/about');
    const destinations = [
      { id: 'student', count: 10, route: '#/apps/student' },
      { id: 'safety', count: 5, route: '#/apps/safety' },
      { id: 'admin', count: 8, route: '#/apps/admin' },
      { id: 'awards', count: 2, route: '#/about/awards' },
    ];
    for (const destination of destinations) {
      const link = desktop.locator(`.about-highlights a[data-highlight="${destination.id}"]`);
      assert.equal(await link.getAttribute('href'), destination.route);
      assert.equal(Number.parseInt(await link.locator('.about-highlight__value').innerText(), 10), destination.count,
        'overview counts match the real app and award inventories');
      await link.click();
      await waitForRoute(desktop, destination.route);
      await desktop.goBack();
      await waitForRoute(desktop, '#/about');
    }
  });

  await check('responsive desktop and tablet views avoid horizontal overflow', desktop, async () => {
    for (const width of [1440, 900]) {
      await desktop.setViewportSize({ width, height: 900 });
      for (const route of ['#/about', '#/apps/student', '#/apps/admin', '#/about/awards', '#/about/organization']) {
        await openRoute(desktop, route);
        const dimensions = await desktop.evaluate(() => ({
          width: innerWidth, contentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        }));
        report.responsive.push({ route, ...dimensions });
        assert.ok(dimensions.contentWidth <= dimensions.viewportWidth + 1,
          `${route} overflows at ${width}px`);
        if (route === '#/about/awards') await screenshot(desktop, `awards-${width}.png`, true);
        if (route === '#/about' && width === 900) await screenshot(desktop, 'tablet-static-homepage.png');
      }
    }
  });
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, reducedMotion: 'reduce',
  });
  const mobile = await mobileContext.newPage();
  watchPage(mobile, 'mobile');
  await check('reduced-motion visitors get a static introduction and final entry', mobile, async () => {
    await mobile.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await mobile.locator('.intro-site .reduced-world').waitFor();
    const shortcut = mobile.getByRole('link', { name: '홈페이지 바로가기', exact: false });
    const shortcutBounds = await shortcut.boundingBox();
    assert.ok(shortcutBounds && shortcutBounds.height >= 50 && shortcutBounds.x >= 0 && shortcutBounds.x + shortcutBounds.width <= 391);
    assert.ok(await shortcut.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize)) >= 15);
    assert.equal(await mobile.locator('.reduced-scene').count(), 5);
    assert.equal(await mobile.locator('.world-film, .intro-loop, .app-workspace, .about-workspace').count(), 0);
    const enter = mobile.locator('.reduced-ending--logo').getByRole('link', { name: '홈페이지 들어가기', exact: false });
    await enter.scrollIntoViewIfNeeded();
    const bounds = await enter.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 391 && bounds.height >= 44);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await screenshot(mobile, 'mobile-static-intro-end.png');
    await enter.click();
    await waitForRoute(mobile, '#/about');
  });

  await check('mobile animated introduction and final entry fit the viewport', mobile, async () => {
    await mobile.emulateMedia({ reducedMotion: 'no-preference' });
    await openRoute(mobile, '#/intro');
    await mobile.locator('.world-film[data-source-variant="mobile"]').waitFor();
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await mobile.locator('.intro-main').focus();
    await mobile.keyboard.press('End');
    const enter = mobile.getByRole('link', { name: '홈페이지 들어가기', exact: false });
    await enter.waitFor({ state: 'visible', timeout: 30_000 });
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await mobile.setViewportSize(viewport);
      await mobile.locator('.intro-main').focus();
      await mobile.keyboard.press('End');
      await enter.waitFor({ state: 'visible', timeout: 30_000 });
      const bounds = await enter.boundingBox();
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1,
        `the entry action stays entirely inside the ${viewport.width}×${viewport.height} mobile viewport`);
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await screenshot(mobile, viewport.width === 390 ? 'mobile-animated-intro-end.png' : 'mobile-landscape-intro-end.png');
    }
    await enter.click();
    await waitForRoute(mobile, '#/about');
    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.emulateMedia({ reducedMotion: 'reduce' });
  });

  await check('mobile navigation, cards, dialogs, and layout remain usable', mobile, async () => {
    await openRoute(mobile, '#/about');
    assert.equal(await mobile.locator('.about-workspace video, .about-film-trigger').count(), 0,
      'the homepage stays static on mobile as well');
    for (const width of [390, 320]) {
      await mobile.setViewportSize({ width, height: 844 });
      assert.equal(await mobile.locator('.site-header').getAttribute('data-theme'), null);
      assert.equal(await mobile.locator('.about-tabs').count(), 0);
      assert.equal(await mobile.locator('.about-highlights a[data-highlight]').count(), 4);
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      for (const element of await mobile.locator('.site-header__nav button, .about-highlights a[data-highlight]').all()) {
        const bounds = await element.boundingBox();
        assert.ok(bounds && bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
          `navigation and overview cards stay within the ${width}px viewport`);
      }
      assert.ok(await mobile.locator('.about-hero h1').evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize)) >= 32);
      await screenshot(mobile, `homepage-${width}.png`, true);
    }
    await menuButton(mobile, '전체 앱').focus();
    await mobile.keyboard.press('ArrowDown');
    const mobilePanel = mobile.locator('#nav-panel-apps');
    await mobilePanel.waitFor();
    const panelBounds = await mobilePanel.boundingBox();
    assert.ok(panelBounds && panelBounds.x >= 0 && panelBounds.x + panelBounds.width <= 321);
    await mobile.keyboard.press('Escape');
    assert.equal(await menuButton(mobile, '전체 앱').getAttribute('aria-expanded'), 'false');
    await mobile.locator('.about-highlights a[data-highlight="safety"]').click();
    await waitForRoute(mobile, '#/apps/safety');
    await mobile.goBack();
    await waitForRoute(mobile, '#/about');
    await mobile.setViewportSize({ width: 390, height: 844 });
    await screenshot(mobile, 'mobile-start.png');
    await openMenu(mobile, '전체 앱');
    await screenshot(mobile, 'mobile-app-menu.png');
    for (const area of areas) {
      await chooseArea(mobile, area);
      for (const image of await mobile.locator('.app-feature__image img').all()) {
        const bounds = await image.locator('..').boundingBox();
        assert.ok(bounds && bounds.width >= 260 && bounds.height >= 190,
          'mobile keeps a large representative image instead of hiding it');
        assert.ok(await image.isVisible());
      }
      const dimensions = await mobile.evaluate(() => ({
        width: innerWidth, contentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      report.responsive.push({ route: `#/apps/${area.id}`, ...dimensions });
      assert.ok(dimensions.contentWidth <= dimensions.viewportWidth + 1);
      if (area.id === 'student') await screenshot(mobile, 'mobile-student.png');
    }
    await chooseArea(mobile, areas[0]);
    const opener = mobile.locator('.app-card[data-project="draconis"]')
      .getByRole('button', { name: /자세히 보기/ });
    await opener.click();
    const dialog = mobile.locator('dialog.app-dialog');
    const bounds = await dialog.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 391);
    await mobile.getByRole('button', { name: '앱 상세 닫기', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await openRoute(mobile, '#/about/awards');
    await verifyAwardEvidence(mobile);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await screenshot(mobile, 'awards-390.png', true);
    await openRoute(mobile, '#/about/organization');
    await mobile.reload({ waitUntil: 'domcontentloaded' });
    await waitForRoute(mobile, '#/about/organization');
    const overflow = await mobile.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false);
    await verifyExternalLinks(mobile);
  });

  await check('mobile Draconis reading surfaces and zoom stay inside the screen', mobile, async () => {
    await openRoute(mobile, '#/apps/student');
    for (const kind of ['presentation', 'gallery']) {
      await mobile.locator('.app-resources').getByRole('button', {
        name: kind === 'presentation' ? '소개 자료' : '학습 화면', exact: false,
      }).click();
      const panel = mobile.locator(`.draconis-${kind}`);
      const introduction = panel.locator(kind === 'presentation'
        ? '.draconis-presentation__copy > p:last-of-type' : '.draconis-gallery__intro');
      assert.ok(await introduction.evaluate(node => Number.parseFloat(getComputedStyle(node).fontSize)) >= 15);
      const opener = panel.getByRole('button', { name: '화면 확대', exact: false });
      await opener.click();
      const dialog = mobile.locator('dialog.draconis-image-viewer');
      await dialog.waitFor();
      const bounds = await dialog.boundingBox();
      assert.ok(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 391 && bounds.y + bounds.height <= 845);
      await dialog.getByRole('button', { name: '글씨 크게', exact: true }).click();
      assert.ok(await dialog.locator('.draconis-image-viewer__viewport').evaluate(node => node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight));
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await screenshot(mobile, `mobile-draconis-${kind}-zoom.png`);
      await dialog.getByRole('button', { name: kind === 'presentation' ? '프레젠테이션 닫기' : '갤러리 닫기', exact: true }).click();
      assert.equal(await opener.evaluate(node => node === document.activeElement), true);
    }
  });
  await mobileContext.close();
} finally {
  await browser.close();
  report.passed = report.checks.length > 0 && report.checks.every((item) => item.passed) &&
    ['consoleErrors', 'pageErrors', 'httpErrors', 'failedRequests'].every((key) => report[key].length === 0);
  await writeFile(join(outputDirectory, 'browser-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}
