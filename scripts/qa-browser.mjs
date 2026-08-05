import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';
const edgePath =
  process.env.QA_BROWSER_PATH ??
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputDirectory = fileURLToPath(new URL('../artifacts/', import.meta.url));

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
});

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  desktop: {},
  tablet: {},
  mobile: {},
  reducedMotion: {},
  hashNavigation: {},
  consoleErrors: [],
  pageErrors: [],
  httpErrors: [],
  failedRequests: [],
};

function watchPage(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      // Chromium emits a generic console line for HTTP failures. The response
      // listener below records the actionable URL and status instead.
      if (message.text().startsWith('Failed to load resource:')) return;
      report.consoleErrors.push({ label, text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    report.pageErrors.push({ label, text: error.message });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      report.httpErrors.push({
        label,
        url: response.url(),
        status: response.status(),
      });
    }
  });
  page.on('requestfailed', (request) => {
    const error = request.failure()?.errorText ?? 'unknown';
    // Rapid currentTime changes intentionally abort in-flight blob reads. This
    // is the seek-coalescing path under test, not a network or decoder failure.
    if (request.url().startsWith('blob:') && error === 'net::ERR_ABORTED') {
      return;
    }
    report.failedRequests.push({
      label,
      url: request.url(),
      error,
    });
  });
}

async function scrollToProgress(page, progress) {
  await page.evaluate((nextProgress) => {
    const world = document.querySelector('.scroll-world');
    if (!(world instanceof HTMLElement)) {
      throw new Error('Scroll World container not found');
    }

    const worldTop = world.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(1, world.offsetHeight - window.innerHeight);
    window.scrollTo(0, worldTop + travel * nextProgress);
  }, progress);
  await page.waitForTimeout(900);
}

async function waitForMaster(page) {
  await page.waitForFunction(
    () => {
      const video = document.querySelector('.world-film');
      return Boolean(video && video.readyState >= HTMLMediaElement.HAVE_METADATA);
    },
    { timeout: 120_000 },
  );
  await page.waitForFunction(
    () => document.querySelector('.world-film')?.classList.contains('is-visible'),
    { timeout: 120_000 },
  );
}

async function waitForSectionAnchor(page, selector) {
  // Let nearby lazy images settle first. If their late intrinsic sizing moves
  // the destination after native anchor navigation, the check below must fail
  // instead of silently taking a screenshot of the preceding section.
  await page.waitForTimeout(650);
  await page.waitForFunction(
    (sectionSelector) => {
      const section = document.querySelector(sectionSelector);
      if (!(section instanceof HTMLElement)) return false;
      const top = section.getBoundingClientRect().top;
      return top >= 0 && top < 140;
    },
    selector,
    { timeout: 10_000 },
  );
}

async function waitForStableHashAnchor(page, selector) {
  await page.waitForFunction(
    (sectionSelector) => {
      const section = document.querySelector(sectionSelector);
      const header = document.querySelector('.site-header');
      if (!(section instanceof HTMLElement) || !(header instanceof HTMLElement)) {
        return false;
      }

      const gap =
        section.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      return Math.abs(gap - 16) <= 2;
    },
    selector,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(180);

  return page.evaluate((sectionSelector) => {
    const section = document.querySelector(sectionSelector);
    const header = document.querySelector('.site-header');
    const activeLinks = [...document.querySelectorAll('.site-header__nav a.is-active')];
    const sectionRect = section?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    const activeLink = activeLinks[0];

    return {
      hash: window.location.hash,
      scrollY: window.scrollY,
      targetTop: sectionRect?.top,
      headerBottom: headerRect?.bottom,
      gap:
        sectionRect && headerRect ? sectionRect.top - headerRect.bottom : null,
      activeCount: activeLinks.length,
      activeHref: activeLink?.getAttribute('href'),
      ariaCurrent: activeLink?.getAttribute('aria-current'),
    };
  }, selector);
}

function hashAnchorPassed(state, expectedHash) {
  return (
    state?.hash === expectedHash &&
    Math.abs(state?.gap - 16) <= 2 &&
    state?.activeCount === 1 &&
    state?.activeHref === expectedHash &&
    state?.ariaCurrent === 'location'
  );
}

async function screenshotSection(page, selector, fileName) {
  await page.evaluate((sectionSelector) => {
    const section = document.querySelector(sectionSelector);
    if (!(section instanceof HTMLElement)) {
      throw new Error(`Section not found: ${sectionSelector}`);
    }

    const top = section.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo(0, Math.max(0, top));
  }, selector);
  await page.waitForTimeout(350);
  await page.screenshot({
    path: join(outputDirectory, fileName),
  });
}

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const desktopPage = await desktopContext.newPage();
  watchPage(desktopPage, 'desktop');
  await desktopPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForMaster(desktopPage);
  await desktopPage.waitForFunction(
    () => {
      const intro = document.querySelector('.intro-loop');
      return Boolean(
        intro &&
          intro.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          intro.classList.contains('is-painted'),
      );
    },
    { timeout: 120_000 },
  );

  report.desktop.start = await desktopPage.evaluate(() => {
    const video = document.querySelector('.world-film');
    const intro = document.querySelector('.intro-loop');
    const cueBadge = document.querySelector('.scroll-cue__badge');
    const cueLabel = document.querySelector('.scroll-cue__copy strong');
    const cueRect = cueBadge?.getBoundingClientRect();
    return {
      h1: document.querySelector('h1')?.textContent?.trim(),
      sceneButtons: document.querySelectorAll('.journey-progress button').length,
      menuLinks: document.querySelectorAll('.site-header__nav a').length,
      mainCount: document.querySelectorAll('main').length,
      duration: video?.duration,
      currentTime: video?.currentTime,
      sourceClass: video?.className,
      introCurrentTime: intro?.currentTime,
      introAutoplay: intro?.autoplay,
      introLoop: intro?.loop,
      introMuted: intro?.muted,
      introPaused: intro?.paused,
      introFit: intro ? getComputedStyle(intro).objectFit : null,
      scrollCueLabel: cueLabel?.textContent?.trim(),
      scrollCueHeight: cueRect?.height,
      scrollCueFontSize: cueLabel
        ? Number.parseFloat(getComputedStyle(cueLabel).fontSize)
        : null,
    };
  });
  await desktopPage.waitForTimeout(700);
  report.desktop.start.introTimeAfter = await desktopPage
    .locator('.intro-loop')
    .evaluate((intro) => intro.currentTime);
  report.desktop.start.introMotion =
    report.desktop.start.introTimeAfter >
    report.desktop.start.introCurrentTime + 0.25;
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-start.png'),
  });

  await scrollToProgress(desktopPage, 2.5 / 44);
  report.desktop.originalBand = await desktopPage.evaluate(() => {
    const video = document.querySelector('.world-film');
    const intro = document.querySelector('.intro-loop');
    const copy = document.querySelector('.scene-copy');
    return {
      currentTime: video?.currentTime,
      opacity: video ? getComputedStyle(video).opacity : null,
      introOpacity: intro ? getComputedStyle(intro).opacity : null,
      introPaused: intro?.paused,
      copyClass: copy?.className,
      copyOpacity: copy ? Number.parseFloat(getComputedStyle(copy).opacity) : null,
      copyBackground: copy ? getComputedStyle(copy).backgroundColor : null,
      activeScene: document.querySelector('.journey-progress button.is-active')
        ?.getAttribute('aria-label'),
    };
  });
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-original-band.png'),
  });

  report.desktop.sceneCopyPanels = [];
  for (const beat of [
    { id: 'dol-ai-lab', time: 2.5 },
    { id: 'draconis', time: 11.5 },
    { id: 'public-data', time: 20.5 },
    { id: 'dolsoe', time: 29.5 },
  ]) {
    await scrollToProgress(desktopPage, beat.time / 44);
    report.desktop.sceneCopyPanels.push(
      await desktopPage.evaluate((id) => {
        const copy = document.querySelector('.scene-copy');
        const heading = copy?.querySelector('h2');
        const paragraph = copy?.querySelector('p');
        return {
          id,
          className: copy?.className,
          background: copy ? getComputedStyle(copy).backgroundColor : null,
          heading: heading?.textContent,
          subtitle: paragraph?.textContent,
          headingWordBreak: heading ? getComputedStyle(heading).wordBreak : null,
          subtitleWordBreak: paragraph ? getComputedStyle(paragraph).wordBreak : null,
        };
      }, beat.id),
    );
    await desktopPage.screenshot({
      path: join(outputDirectory, `desktop-scene-copy-${beat.id}.png`),
    });
  }

  await scrollToProgress(desktopPage, 0.62);
  const forwardTime = await desktopPage
    .locator('.world-film')
    .evaluate((video) => video.currentTime);
  await scrollToProgress(desktopPage, 0.31);
  const reverseTime = await desktopPage
    .locator('.world-film')
    .evaluate((video) => video.currentTime);
  report.desktop.reverse = {
    forwardTime,
    reverseTime,
    passed: reverseTime < forwardTime,
  };
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-reverse.png'),
  });

  await scrollToProgress(desktopPage, 35.2 / 44);
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-transition-five-early.png'),
  });
  await scrollToProgress(desktopPage, 35.8 / 44);
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-transition-five-late.png'),
  });

  report.desktop.sceneFiveBeats = [];
  for (const beat of [
    { name: 'overview', time: 37.2 },
    { name: 'push-in', time: 38.45 },
    { name: 'community', time: 39.7 },
    { name: 'finale', time: 40.7 },
  ]) {
    await scrollToProgress(desktopPage, beat.time / 44);
    report.desktop.sceneFiveBeats.push({
      name: beat.name,
      currentTime: await desktopPage
        .locator('.world-film')
        .evaluate((video) => video.currentTime),
    });
    await desktopPage.screenshot({
      path: join(outputDirectory, `desktop-scene-five-${beat.name}.png`),
    });
  }
  report.desktop.sceneFive = await desktopPage.evaluate(() => ({
    currentTime: document.querySelector('.world-film')?.currentTime,
    activeScene: document.querySelector('.journey-progress button.is-active')
      ?.getAttribute('aria-label'),
    activeCopyCount: document.querySelectorAll('.scene-copy').length,
    originalPosterCount: document.querySelectorAll(
      'img[src="/assets/scene5_services.png"]',
    ).length,
  }));

  await scrollToProgress(desktopPage, 43.45 / 44);
  report.desktop.ending = await desktopPage.evaluate(() => {
    const brand = document.querySelector('.end-brand');
    const wordmark = document.querySelector('.end-brand__wordmark strong');
    return {
      brandCount: document.querySelectorAll('.end-brand').length,
      text: brand?.textContent?.replace(/\s+/g, ' ').trim(),
      wordmarkColor: wordmark ? getComputedStyle(wordmark).color : null,
      background: brand ? getComputedStyle(brand).backgroundImage : null,
    };
  });
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-ending.png'),
  });

  await desktopPage.locator('.site-header__nav a[href="#lab-intro"]').click();
  await waitForSectionAnchor(desktopPage, '#lab-intro');
  report.desktop.content = await desktopPage.evaluate(() => {
    const section = document.querySelector('#lab-intro');
    const bodyText = document.body.textContent ?? '';
    const introTitle = document.querySelector('.intro-editorial__copy h2');
    const organizationTitle = document.querySelector('.organization .subsection-heading h2');
    const organizationBody = document.querySelector(
      '.organization__departments article div > p:last-child',
    );
    const awardTitle = document.querySelector('.award-card h3');
    const principleGrid = document.querySelector('.principle-grid');
    const fontSize = (element) =>
      element ? Number.parseFloat(getComputedStyle(element).fontSize) : null;
    const sectionOrder = [
      '#lab-intro',
      '#lab-featured',
      '#lab-awards',
      '#lab-services',
      '#lab-organization',
    ].map((selector) => document.querySelector(selector)?.offsetTop);
    return {
      menuLabels: Array.from(
        document.querySelectorAll('.site-header__nav a'),
        (link) => link.textContent?.trim(),
      ),
      introTop: section?.getBoundingClientRect().top,
      sectionOrder,
      operatingModels: document.querySelectorAll('.operating-model').length,
      organizationGroups: document.querySelectorAll('.organization__roster > div').length,
      roadmaps: document.querySelectorAll('.roadmap').length,
      principleCards: document.querySelectorAll('.principle-grid article').length,
      principleBodies: document.querySelectorAll('.principle-grid article p').length,
      principleColumns: principleGrid
        ? getComputedStyle(principleGrid).gridTemplateColumns.split(' ').length
        : 0,
      featuredCards: document.querySelectorAll('.featured-card').length,
      awardCards: document.querySelectorAll('.award-card').length,
      portfolioCards: document.querySelectorAll('.project-card').length,
      portfolioFilters: document.querySelectorAll('.portfolio-filter button').length,
      credentialLeak:
        bodyText.includes('teacher1234') || bodyText.includes('neis'),
      removedRoadmapCopy: !bodyText.includes('향후 운영계획'),
      contentWordBreak: section ? getComputedStyle(section).wordBreak : null,
      awardWordBreak: awardTitle ? getComputedStyle(awardTitle).wordBreak : null,
      awardTitleLineSets: Array.from(
        document.querySelectorAll('.award-card h3'),
        (heading) =>
          Array.from(heading.querySelectorAll('span'), (line) => line.textContent),
      ),
      introTitleFontSize: fontSize(introTitle),
      organizationTitleFontSize: fontSize(organizationTitle),
      organizationBodyFontSize: fontSize(organizationBody),
    };
  });
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-content-intro.png'),
  });
  await screenshotSection(
    desktopPage,
    '.principle-grid',
    'desktop-content-principles.png',
  );
  await desktopPage.locator('.site-header__nav a[href="#lab-featured"]').click();
  await waitForSectionAnchor(desktopPage, '#lab-featured');
  report.desktop.featuredAnchorTop = await desktopPage
    .locator('#lab-featured')
    .evaluate((section) => section.getBoundingClientRect().top);
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-content-featured.png'),
  });
  report.desktop.featured = await desktopPage.evaluate(() => {
    const grid = document.querySelector('.featured-grid');
    const draconis = document.querySelector(
      '.featured-card[data-service="draconis"]',
    );
    const secondaryCards = [
      ...document.querySelectorAll(
        '.featured-card[data-service="dolsoe"], .featured-card[data-service="seokam-on"], .featured-card[data-service="dolflix"]',
      ),
    ];
    const width = (element) => element?.getBoundingClientRect().width ?? 0;
    const tops = secondaryCards.map((card) => card.getBoundingClientRect().top);
    const widths = secondaryCards.map((card) => card.getBoundingClientRect().width);
    const presentationRect = draconis
      ?.querySelector('.draconis-presentation')
      ?.getBoundingClientRect();
    const draconisContentRect = draconis
      ?.querySelector('.featured-card__content')
      ?.getBoundingClientRect();
    return {
      galleryItems: document.querySelectorAll('.draconis-gallery__item').length,
      galleryTitleFontSize: Number.parseFloat(
        getComputedStyle(
          document.querySelector('.draconis-gallery__header h3'),
        ).fontSize,
      ),
      draconisFullWidth: width(draconis) >= width(grid) - 2,
      draconisMediaCount:
        draconis?.querySelectorAll('.featured-card__media').length ?? null,
      presentationLinkCount:
        draconis?.querySelectorAll('.draconis-presentation a[download]')
          .length ?? null,
      presentationHref:
        draconis
          ?.querySelector('.draconis-presentation a[download]')
          ?.getAttribute('href') ?? null,
      presentationDownload:
        draconis
          ?.querySelector('.draconis-presentation a[download]')
          ?.getAttribute('download') ?? null,
      presentationSlideImageCount:
        draconis?.querySelectorAll('.draconis-presentation__stage > img')
          .length ?? null,
      presentationThumbnailCount:
        draconis?.querySelectorAll(
          '.draconis-presentation__thumbnails button',
        ).length ?? null,
      presentationCounter:
        draconis
          ?.querySelector('.draconis-presentation__counter')
          ?.textContent?.trim() ?? null,
      presentationHorizontalOverflow:
        presentationRect && draconisContentRect
          ? Math.max(
              0,
              presentationRect.right - draconisContentRect.right,
              draconisContentRect.left - presentationRect.left,
            )
          : null,
      futureVideoDisabled:
        draconis?.querySelector(
          '.draconis-presentation__actions .is-placeholder',
        )?.disabled ?? null,
      secondaryCards: secondaryCards.length,
      secondaryImageFits: secondaryCards.map(
        (card) =>
          getComputedStyle(card.querySelector('.featured-card__media img'))
            .objectFit,
      ),
      secondaryTopSpread: tops.length ? Math.max(...tops) - Math.min(...tops) : null,
      secondaryWidthSpread: widths.length
        ? Math.max(...widths) - Math.min(...widths)
        : null,
      secondaryMediaMaxHeight: Math.max(
        0,
        ...secondaryCards.map(
          (card) =>
            card.querySelector('.featured-card__media')?.getBoundingClientRect()
              .height ?? 0,
        ),
      ),
    };
  });
  await screenshotSection(
    desktopPage,
    '.draconis-presentation',
    'desktop-content-draconis-presentation.png',
  );
  await screenshotSection(
    desktopPage,
    '.draconis-gallery',
    'desktop-content-draconis-gallery.png',
  );
  await desktopPage
    .locator('.draconis-presentation__nav--next')
    .click();
  report.desktop.featured.presentationInteraction =
    await desktopPage.evaluate(() => ({
      counter:
        document
          .querySelector('.draconis-presentation__counter')
          ?.textContent?.trim() ?? null,
      image:
        document
          .querySelector('.draconis-presentation__stage > img')
          ?.getAttribute('src') ?? null,
      activeThumbnail:
        document.querySelectorAll(
          '.draconis-presentation__thumbnails button.is-active',
        ).length,
    }));
  await screenshotSection(
    desktopPage,
    '.featured-card[data-service="dolsoe"]',
    'desktop-content-featured-secondary.png',
  );
  await desktopPage.locator('.draconis-gallery__thumbnail').first().click();
  await desktopPage.keyboard.press('ArrowRight');
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-content-draconis-gallery-dialog.png'),
  });
  report.desktop.featured.galleryDialog = await desktopPage.evaluate(() => {
    const backdrop = document.querySelector('.draconis-gallery__backdrop');
    const dialog = document.querySelector('.draconis-gallery__dialog');
    const closeButton = document.querySelector('.draconis-gallery__dialog-close');
    const controls = document.querySelector('.draconis-gallery__dialog-controls');
    const backdropRect = backdrop?.getBoundingClientRect();
    const dialogRect = dialog?.getBoundingClientRect();
    const closeButtonRect = closeButton?.getBoundingClientRect();
    const controlsRect = controls?.getBoundingClientRect();

    return {
      open: document.querySelectorAll('.draconis-gallery__dialog').length,
      count: document.querySelector('.draconis-gallery__dialog-count')?.textContent?.trim(),
      portalToBody: backdrop?.parentElement === document.body,
      viewportHeight: window.innerHeight,
      backdropTop: backdropRect?.top,
      backdropBottom: backdropRect?.bottom,
      dialogTop: dialogRect?.top,
      dialogBottom: dialogRect?.bottom,
      closeButtonTop: closeButtonRect?.top,
      controlsBottom: controlsRect?.bottom,
    };
  });
  await desktopPage.keyboard.press('Escape');
  report.desktop.featured.galleryDialog.closed =
    (await desktopPage.locator('.draconis-gallery__dialog').count()) === 0;

  await desktopPage.locator('.site-header__nav a[href="#lab-awards"]').click();
  await waitForSectionAnchor(desktopPage, '#lab-awards');
  report.desktop.awardsAnchor = await desktopPage.evaluate(() => {
    const featured = document.querySelector('#lab-featured');
    const awards = document.querySelector('#lab-awards');
    const heading = document.querySelector('#lab-awards h2');
    const featuredRect = featured?.getBoundingClientRect();
    const awardsRect = awards?.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      featuredTop: featuredRect?.top,
      featuredBottom: featuredRect?.bottom,
      awardsTop: awardsRect?.top,
      awardsBottom: awardsRect?.bottom,
      awardsHeadingTop: heading?.getBoundingClientRect().top,
      awardsBackground: awards ? getComputedStyle(awards).backgroundImage : null,
    };
  });
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-content-awards.png'),
  });
  await screenshotSection(
    desktopPage,
    '.award-card:nth-child(2)',
    'desktop-content-award-dolsoe.png',
  );

  await desktopPage.locator('.site-header__nav a[href="#lab-services"]').click();
  await waitForSectionAnchor(desktopPage, '#lab-services');
  await desktopPage
    .locator('.portfolio-filter button', { hasText: '학습앱' })
    .click();
  await desktopPage.waitForTimeout(250);
  report.desktop.portfolioFilter = {
    learningCards: await desktopPage.locator('.project-card').count(),
    pressed: await desktopPage
      .locator('.portfolio-filter button', { hasText: '학습앱' })
      .getAttribute('aria-pressed'),
  };
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-content-portfolio.png'),
  });

  await desktopPage.locator('.site-header__nav a[href="#lab-organization"]').click();
  await waitForSectionAnchor(desktopPage, '#lab-organization');
  report.desktop.organizationAnchorTop = await desktopPage
    .locator('#lab-organization')
    .evaluate((section) => section.getBoundingClientRect().top);
  await desktopPage.screenshot({
    path: join(outputDirectory, 'desktop-content-organization.png'),
  });
  await desktopContext.close();

  const tabletContext = await browser.newContext({
    viewport: { width: 900, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const tabletPage = await tabletContext.newPage();
  watchPage(tabletPage, 'tablet');
  await tabletPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await tabletPage.locator('.site-header__nav a[href="#lab-intro"]').click();
  await waitForSectionAnchor(tabletPage, '#lab-intro');
  report.tablet = await tabletPage.evaluate(() => {
    const grid = document.querySelector('.principle-grid');
    const cards = [...document.querySelectorAll('.principle-grid article')];
    const tops = cards.map((card) => card.getBoundingClientRect().top);
    return {
      viewport: [window.innerWidth, window.innerHeight],
      cards: cards.length,
      display: grid ? getComputedStyle(grid).display : null,
      topSpread: tops.length ? Math.max(...tops) - Math.min(...tops) : null,
      railOverflow: grid ? grid.scrollWidth > grid.clientWidth + 1 : null,
      pageOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
      titleWordBreak: cards[0]
        ? getComputedStyle(cards[0].querySelector('h3')).wordBreak
        : null,
    };
  });
  await tabletPage.screenshot({
    path: join(outputDirectory, 'tablet-content-intro.png'),
  });
  await tabletContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  const mobilePage = await mobileContext.newPage();
  watchPage(mobilePage, 'mobile');
  await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await waitForMaster(mobilePage);
  await scrollToProgress(mobilePage, 11.5 / 44);
  report.mobile = await mobilePage.evaluate(() => {
    const video = document.querySelector('.world-film');
    const intro = document.querySelector('.intro-loop');
    const poster = document.querySelector('.poster-layer.is-active .poster-layer__image');
    return {
      viewport: [window.innerWidth, window.innerHeight],
      currentTime: video?.currentTime,
      duration: video?.duration,
      videoFit: video ? getComputedStyle(video).objectFit : null,
      posterFit: poster ? getComputedStyle(poster).objectFit : null,
      videoClass: video?.className,
      videoSourceVariant: video?.dataset.sourceVariant,
      introFit: intro ? getComputedStyle(intro).objectFit : null,
      introSource: intro?.currentSrc,
      posterSource: poster?.getAttribute('src'),
      sceneButtons: document.querySelectorAll('.journey-progress button').length,
      menuLinks: document.querySelectorAll('.site-header__nav a').length,
    };
  });
  await mobilePage.screenshot({
    path: join(outputDirectory, 'mobile-scene.png'),
  });
  await mobilePage.locator('.site-header__nav a[href="#lab-intro"]').click();
  await waitForSectionAnchor(mobilePage, '#lab-intro');
  report.mobile.content = await mobilePage.evaluate(() => ({
    introTop: document.querySelector('#lab-intro')?.getBoundingClientRect().top,
    featuredColumns: getComputedStyle(
      document.querySelector('.featured-grid'),
    ).gridTemplateColumns,
    horizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  await mobilePage.screenshot({
    path: join(outputDirectory, 'mobile-content-intro.png'),
  });
  await mobilePage.locator('.site-header__nav a[href="#lab-featured"]').click();
  await waitForSectionAnchor(mobilePage, '#lab-featured');
  report.mobile.presentation = await mobilePage.evaluate(() => {
    const presentation = document.querySelector('.draconis-presentation');
    const stage = document.querySelector('.draconis-presentation__stage');
    const thumbnails = document.querySelector(
      '.draconis-presentation__thumbnails',
    );
    const presentationRect = presentation?.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    return {
      slideCount: document.querySelectorAll(
        '.draconis-presentation__thumbnails button',
      ).length,
      stageWithinPresentation:
        presentationRect && stageRect
          ? stageRect.left >= presentationRect.left - 1 &&
            stageRect.right <= presentationRect.right + 1
          : null,
      thumbnailRailOverflow:
        thumbnails?.scrollWidth > thumbnails?.clientWidth + 1,
      pageOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    };
  });
  await screenshotSection(
    mobilePage,
    '.draconis-presentation',
    'mobile-content-draconis-presentation.png',
  );
  await mobilePage.locator('.site-header__nav a[href="#lab-organization"]').click();
  await waitForSectionAnchor(mobilePage, '#lab-organization');
  report.mobile.organizationTop = await mobilePage
    .locator('#lab-organization')
    .evaluate((section) => section.getBoundingClientRect().top);
  await mobilePage.screenshot({
    path: join(outputDirectory, 'mobile-content-organization.png'),
  });
  await mobileContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  const reducedPage = await reducedContext.newPage();
  watchPage(reducedPage, 'reduced-motion');
  await reducedPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  report.reducedMotion = await reducedPage.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent?.trim(),
    worldVideoCount: document.querySelectorAll('.scroll-world video').length,
    presentationLinkCount: document.querySelectorAll(
      '.draconis-presentation a[download]',
    ).length,
    sceneCount: document.querySelectorAll('.reduced-scene').length,
    copyPanelCount: document.querySelectorAll('.reduced-scene__copy').length,
    copyPanelBackground: getComputedStyle(
      document.querySelector('.reduced-scene__copy'),
    ).backgroundColor,
    endingCount: document.querySelectorAll('.reduced-ending').length,
    motionControlCount: document.querySelectorAll(
      '.motion-preference--static',
    ).length,
    motionControlTop: document
      .querySelector('.motion-preference--static')
      ?.getBoundingClientRect().top,
    headerBottom: document.querySelector('.site-header')?.getBoundingClientRect().bottom,
  }));
  await reducedPage.locator('.motion-preference--static').click();
  await reducedPage.waitForFunction(
    () =>
      document.documentElement.dataset.motionPreference === 'animated' &&
      document.querySelectorAll('.scroll-world video').length === 2,
    { timeout: 10_000 },
  );
  await waitForMaster(reducedPage);
  report.reducedMotion.animatedOverride = await reducedPage.evaluate(() => ({
    motionPreference: document.documentElement.dataset.motionPreference,
    worldVideoCount: document.querySelectorAll('.scroll-world video').length,
    returnControlCount: document.querySelectorAll(
      '.motion-preference--animated',
    ).length,
  }));
  await reducedPage.locator('.motion-preference--animated').click();
  await reducedPage.waitForFunction(
    () =>
      document.documentElement.dataset.motionPreference === 'system' &&
      document.querySelectorAll('.reduced-scene').length === 5,
    { timeout: 10_000 },
  );
  report.reducedMotion.returnedToStatic = true;
  await reducedPage.screenshot({
    path: join(outputDirectory, 'reduced-motion.png'),
  });
  await reducedContext.close();

  const hashContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const hashPage = await hashContext.newPage();
  watchPage(hashPage, 'hash-desktop');
  await hashPage.goto(new URL('#lab-awards', `${baseUrl}/`).href, {
    waitUntil: 'domcontentloaded',
  });
  report.hashNavigation.desktopDirect = await waitForStableHashAnchor(
    hashPage,
    '#lab-awards',
  );
  await hashPage.reload({ waitUntil: 'domcontentloaded' });
  report.hashNavigation.desktopReload = await waitForStableHashAnchor(
    hashPage,
    '#lab-awards',
  );

  await hashPage.evaluate(() => {
    window.location.hash = '#lab-services';
  });
  report.hashNavigation.hashChange = await waitForStableHashAnchor(
    hashPage,
    '#lab-services',
  );
  await hashPage.goBack();
  report.hashNavigation.historyBack = await waitForStableHashAnchor(
    hashPage,
    '#lab-awards',
  );
  await hashPage.goForward();
  report.hashNavigation.historyForward = await waitForStableHashAnchor(
    hashPage,
    '#lab-services',
  );
  await hashContext.close();

  const hashMobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const hashMobilePage = await hashMobileContext.newPage();
  watchPage(hashMobilePage, 'hash-mobile');
  await hashMobilePage.goto(
    new URL('#lab-organization', `${baseUrl}/`).href,
    { waitUntil: 'domcontentloaded' },
  );
  report.hashNavigation.mobileDirect = await waitForStableHashAnchor(
    hashMobilePage,
    '#lab-organization',
  );
  await hashMobileContext.close();

  const hashAnimatedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });
  const hashAnimatedPage = await hashAnimatedContext.newPage();
  await hashAnimatedPage.goto(new URL('#lab-intro', `${baseUrl}/`).href, {
    waitUntil: 'domcontentloaded',
  });
  report.hashNavigation.animatedDirect = await waitForStableHashAnchor(
    hashAnimatedPage,
    '#lab-intro',
  );
  await hashAnimatedContext.close();
} finally {
  await browser.close();
}

report.passed =
  report.desktop.reverse?.passed === true &&
  report.desktop.start?.menuLinks === 5 &&
  report.desktop.start?.mainCount === 1 &&
  report.desktop.start?.introAutoplay === true &&
  report.desktop.start?.introLoop === true &&
  report.desktop.start?.introMuted === true &&
  report.desktop.start?.introMotion === true &&
  report.desktop.start?.scrollCueLabel === '아래로 스크롤' &&
  report.desktop.start?.scrollCueHeight >= 50 &&
  report.desktop.start?.scrollCueFontSize >= 14 &&
  report.desktop.originalBand?.opacity === '1' &&
  report.desktop.originalBand?.introOpacity === '0' &&
  report.desktop.originalBand?.introPaused === true &&
  report.desktop.originalBand?.copyClass?.includes('scene-copy--emphasis') &&
  report.desktop.originalBand?.copyOpacity > 0.5 &&
  report.desktop.sceneCopyPanels?.length === 4 &&
  report.desktop.sceneCopyPanels?.every(
    (item) =>
      item.className?.includes('scene-copy--emphasis') &&
      item.background === 'rgba(3, 15, 31, 0.76)' &&
      item.headingWordBreak === 'keep-all' &&
      item.subtitleWordBreak === 'keep-all',
  ) &&
  report.desktop.sceneFive?.activeCopyCount === 0 &&
  report.desktop.sceneFive?.originalPosterCount >= 1 &&
  report.desktop.ending?.brandCount === 1 &&
  report.desktop.ending?.text?.includes('돌 AI연구소') &&
  report.desktop.content?.menuLabels?.join('|') ===
    '연구소 소개|대표 서비스|연구소 수상|서비스 포트폴리오|운영조직' &&
  report.desktop.content?.introTop >= 0 &&
  report.desktop.content?.introTop < 140 &&
  report.desktop.featuredAnchorTop >= 0 &&
  report.desktop.featuredAnchorTop < 140 &&
  report.desktop.awardsAnchor?.awardsTop >= 0 &&
  report.desktop.awardsAnchor?.awardsTop < 140 &&
  report.desktop.organizationAnchorTop >= 0 &&
  report.desktop.organizationAnchorTop < 140 &&
  report.desktop.content?.sectionOrder?.every(
    (offset, index, offsets) => index === 0 || offset > offsets[index - 1],
  ) &&
  report.desktop.content?.operatingModels === 0 &&
  report.desktop.content?.organizationGroups === 4 &&
  report.desktop.content?.roadmaps === 0 &&
  report.desktop.content?.removedRoadmapCopy === true &&
  report.desktop.content?.principleCards === 4 &&
  report.desktop.content?.principleBodies === 0 &&
  report.desktop.content?.principleColumns === 4 &&
  report.desktop.content?.featuredCards === 4 &&
  report.desktop.content?.awardCards === 2 &&
  report.desktop.content?.portfolioCards === 13 &&
  report.desktop.content?.portfolioFilters === 5 &&
  report.desktop.content?.credentialLeak === false &&
  report.desktop.content?.contentWordBreak === 'keep-all' &&
  report.desktop.content?.awardWordBreak === 'keep-all' &&
  report.desktop.content?.awardTitleLineSets?.[0]?.join('|') ===
    '반경 너머,|도달 가능성으로' &&
  report.desktop.content?.awardTitleLineSets?.[1]?.join('|') ===
    'AI 학교 사업 계획|법령 검토 비서,|돌쇠' &&
  report.desktop.content?.introTitleFontSize <= 80 &&
  report.desktop.content?.organizationTitleFontSize <= 52 &&
  report.desktop.content?.organizationBodyFontSize >= 15 &&
  report.desktop.featured?.galleryItems === 27 &&
  report.desktop.featured?.galleryTitleFontSize <= 17 &&
  report.desktop.featured?.draconisFullWidth === true &&
  report.desktop.featured?.draconisMediaCount === 0 &&
  report.desktop.featured?.presentationLinkCount === 1 &&
  report.desktop.featured?.presentationHref ===
    '/assets/lab/draconis-presentation-2026-07-31.ppsm' &&
  report.desktop.featured?.presentationDownload ===
    'draconis-presentation(2026.07.31).ppsm' &&
  report.desktop.featured?.presentationSlideImageCount === 1 &&
  report.desktop.featured?.presentationThumbnailCount === 18 &&
  report.desktop.featured?.presentationCounter === '1 / 18' &&
  report.desktop.featured?.presentationHorizontalOverflow <= 1 &&
  report.desktop.featured?.presentationInteraction?.counter === '2 / 18' &&
  report.desktop.featured?.presentationInteraction?.image ===
    '/assets/lab/draconis-presentation/slides/slide-02.jpg' &&
  report.desktop.featured?.presentationInteraction?.activeThumbnail === 1 &&
  report.desktop.featured?.futureVideoDisabled === true &&
  report.desktop.featured?.secondaryCards === 3 &&
  report.desktop.featured?.secondaryImageFits?.join('|') ===
    'cover|cover|cover' &&
  report.desktop.featured?.secondaryTopSpread <= 1 &&
  report.desktop.featured?.secondaryWidthSpread <= 2 &&
  report.desktop.featured?.secondaryMediaMaxHeight <= 180 &&
  report.desktop.featured?.galleryDialog?.open === 1 &&
  report.desktop.featured?.galleryDialog?.count === '2 / 27' &&
  report.desktop.featured?.galleryDialog?.portalToBody === true &&
  report.desktop.featured?.galleryDialog?.backdropTop === 0 &&
  report.desktop.featured?.galleryDialog?.backdropBottom ===
    report.desktop.featured?.galleryDialog?.viewportHeight &&
  report.desktop.featured?.galleryDialog?.dialogTop >= 8 &&
  report.desktop.featured?.galleryDialog?.dialogBottom <=
    report.desktop.featured?.galleryDialog?.viewportHeight - 8 &&
  report.desktop.featured?.galleryDialog?.closeButtonTop >= 8 &&
  report.desktop.featured?.galleryDialog?.controlsBottom <=
    report.desktop.featured?.galleryDialog?.viewportHeight - 8 &&
  report.desktop.featured?.galleryDialog?.closed === true &&
  report.desktop.portfolioFilter?.learningCards === 5 &&
  report.desktop.portfolioFilter?.pressed === 'true' &&
  report.tablet.cards === 4 &&
  report.tablet.display === 'grid' &&
  report.tablet.topSpread <= 1 &&
  report.tablet.railOverflow === true &&
  report.tablet.pageOverflow === false &&
  report.tablet.titleWordBreak === 'keep-all' &&
  report.mobile.videoFit === 'contain' &&
  report.mobile.videoSourceVariant === 'mobile' &&
  report.mobile.introSource?.endsWith(
    '/generated/hero/dol-ai-lab-living-loop-mobile.mp4',
  ) &&
  report.mobile.introFit === 'contain' &&
  report.mobile.posterFit === 'contain' &&
  report.mobile.menuLinks === 5 &&
  report.mobile.content?.introTop >= 0 &&
  report.mobile.content?.introTop < 140 &&
  report.mobile.organizationTop >= 0 &&
  report.mobile.organizationTop < 140 &&
  report.mobile.content?.horizontalOverflow === false &&
  report.mobile.presentation?.slideCount === 18 &&
  report.mobile.presentation?.stageWithinPresentation === true &&
  report.mobile.presentation?.thumbnailRailOverflow === true &&
  report.mobile.presentation?.pageOverflow === false &&
  report.reducedMotion.worldVideoCount === 0 &&
  report.reducedMotion.motionControlCount === 1 &&
  report.reducedMotion.motionControlTop >= report.reducedMotion.headerBottom &&
  report.reducedMotion.animatedOverride?.motionPreference === 'animated' &&
  report.reducedMotion.animatedOverride?.worldVideoCount === 2 &&
  report.reducedMotion.animatedOverride?.returnControlCount === 1 &&
  report.reducedMotion.returnedToStatic === true &&
  report.reducedMotion.presentationLinkCount === 1 &&
  report.reducedMotion.sceneCount === 5 &&
  report.reducedMotion.copyPanelCount === 4 &&
  report.reducedMotion.copyPanelBackground === 'rgba(3, 15, 31, 0.76)' &&
  hashAnchorPassed(
    report.hashNavigation.desktopDirect,
    '#lab-awards',
  ) &&
  hashAnchorPassed(
    report.hashNavigation.desktopReload,
    '#lab-awards',
  ) &&
  hashAnchorPassed(
    report.hashNavigation.hashChange,
    '#lab-services',
  ) &&
  hashAnchorPassed(
    report.hashNavigation.historyBack,
    '#lab-awards',
  ) &&
  hashAnchorPassed(
    report.hashNavigation.historyForward,
    '#lab-services',
  ) &&
  hashAnchorPassed(
    report.hashNavigation.mobileDirect,
    '#lab-organization',
  ) &&
  hashAnchorPassed(
    report.hashNavigation.animatedDirect,
    '#lab-intro',
  ) &&
  report.consoleErrors.length === 0 &&
  report.pageErrors.length === 0 &&
  report.httpErrors.length === 0 &&
  report.failedRequests.length === 0;

await writeFile(
  join(outputDirectory, 'browser-qa.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
