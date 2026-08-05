import { useEffect } from 'react';

const ALIGNMENT_WINDOW_MS = 2_500;
const REQUIRED_STABLE_FRAMES = 4;

function readHashTarget() {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash) return null;

  try {
    return document.getElementById(decodeURIComponent(rawHash));
  } catch {
    return document.getElementById(rawHash);
  }
}

function targetScrollTop(target: HTMLElement) {
  const scrollMargin = Number.parseFloat(
    window.getComputedStyle(target).scrollMarginTop,
  );
  const margin = Number.isFinite(scrollMargin) ? scrollMargin : 0;
  const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  return Math.min(maxScroll, Math.max(0, absoluteTop - margin));
}

/**
 * Browsers can try to resolve an initial URL fragment before React has mounted
 * its target. Re-align the fragment after mount and while the first layout is
 * settling, then get out of the way as soon as the visitor interacts.
 */
export function useStableHashNavigation() {
  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    let animationFrame = 0;
    let observer: ResizeObserver | null = null;
    let observerTimer = 0;
    let deadline = 0;
    let stableFrames = 0;
    let lastTop = Number.NaN;

    const stopAlignment = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      observer?.disconnect();
      observer = null;
      if (observerTimer) {
        window.clearTimeout(observerTimer);
        observerTimer = 0;
      }
    };

    const align = () => {
      animationFrame = 0;
      if (!window.location.hash || performance.now() > deadline) return;

      const target = readHashTarget();
      if (!target) {
        animationFrame = window.requestAnimationFrame(align);
        return;
      }

      const nextTop = targetScrollTop(target);
      if (Math.abs(window.scrollY - nextTop) > 0.5) {
        window.scrollTo({ top: nextTop, behavior: 'auto' });
      }

      stableFrames = Math.abs(nextTop - lastTop) <= 0.5 ? stableFrames + 1 : 0;
      lastTop = nextTop;

      if (stableFrames < REQUIRED_STABLE_FRAMES) {
        animationFrame = window.requestAnimationFrame(align);
      }
    };

    const beginAlignment = () => {
      stopAlignment();
      if (!window.location.hash) return;

      deadline = performance.now() + ALIGNMENT_WINDOW_MS;
      stableFrames = 0;
      lastTop = Number.NaN;
      animationFrame = window.requestAnimationFrame(align);

      if ('ResizeObserver' in window) {
        observer = new ResizeObserver(() => {
          if (!animationFrame && performance.now() <= deadline) {
            stableFrames = 0;
            animationFrame = window.requestAnimationFrame(align);
          }
        });
        observer.observe(document.documentElement);
        observer.observe(document.body);
        observerTimer = window.setTimeout(stopAlignment, ALIGNMENT_WINDOW_MS);
      }
    };

    const cancelForUserInput = () => stopAlignment();
    const handleDocumentClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href*="#"]',
      );
      if (!link || link.origin !== window.location.origin) return;

      window.requestAnimationFrame(beginAlignment);
    };

    window.addEventListener('hashchange', beginAlignment);
    window.addEventListener('pageshow', beginAlignment);
    window.addEventListener('load', beginAlignment);
    window.addEventListener('wheel', cancelForUserInput, { passive: true });
    window.addEventListener('touchstart', cancelForUserInput, { passive: true });
    window.addEventListener('pointerdown', cancelForUserInput, { passive: true });
    window.addEventListener('keydown', cancelForUserInput);
    document.addEventListener('click', handleDocumentClick);

    beginAlignment();
    void document.fonts?.ready.then(beginAlignment);

    return () => {
      stopAlignment();
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener('hashchange', beginAlignment);
      window.removeEventListener('pageshow', beginAlignment);
      window.removeEventListener('load', beginAlignment);
      window.removeEventListener('wheel', cancelForUserInput);
      window.removeEventListener('touchstart', cancelForUserInput);
      window.removeEventListener('pointerdown', cancelForUserInput);
      window.removeEventListener('keydown', cancelForUserInput);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
}
