import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type UseScrollVideoOptions = {
  containerRef: RefObject<HTMLElement>;
  videoRef: RefObject<HTMLVideoElement>;
  desktopSources: readonly string[];
  mobileSources: readonly string[];
  timelineDuration: number;
  /** Opt-in: idle on the same master from 0 to this time, with UI held at 0.
   * Forward scroll holds the current frame until its mapped time catches up;
   * returning to the top rearms only after the actual seek settles at 0.
   * Disabled by default so the existing mobile journey is unchanged. */
  openingIdleEnd?: number;
};

type LoadState = {
  isLoading: boolean;
  loadProgress: number | null;
  ready: boolean;
  painted: boolean;
  error: string | null;
  activeSource: string | null;
};

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const MOBILE_UI_QUERY = '(max-width: 860px), (pointer: coarse)';
const PORTRAIT_SOURCE_QUERY =
  '(orientation: portrait) and (max-width: 1024px)';
const CONSTRAINED_CONNECTION_TYPES = new Set(['slow-2g', '2g', '3g']);
const PAINT_CONFIRM_TIMEOUT_MS = 2400;
const FIRST_FRAME_TIMEOUT_MS = 45000;
const SEEK_RETARGET_INTERVAL_MS = 200;

function getNetworkConnection() {
  if (typeof navigator === 'undefined') return null;
  const networkNavigator = navigator as NavigatorWithConnection;
  return (
    networkNavigator.connection ??
    networkNavigator.mozConnection ??
    networkNavigator.webkitConnection ??
    null
  );
}

function connectionIsConstrained(connection: NetworkInformationLike | null) {
  if (!connection) return false;
  return Boolean(
    connection.saveData ||
      (connection.effectiveType &&
        CONSTRAINED_CONNECTION_TYPES.has(connection.effectiveType)),
  );
}

function isTouchCapableDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

function subscribeToMediaQuery(
  media: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }

  media.addListener(listener);
  return () => media.removeListener(listener);
}

function waitForMetadata(video: HTMLVideoElement, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const clear = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('error', handleError);
      signal.removeEventListener('abort', handleAbort);
    };
    const handleLoaded = () => {
      clear();
      resolve();
    };
    const handleError = () => {
      clear();
      reject(new Error('브라우저가 master 영상을 해석하지 못했습니다.'));
    };
    const handleAbort = () => {
      clear();
      reject(new DOMException('영상 로딩이 취소되었습니다.', 'AbortError'));
    };
    const timeout = window.setTimeout(() => {
      clear();
      reject(new Error('영상 연결이 지연되고 있습니다. 다시 시도해 주세요.'));
    }, FIRST_FRAME_TIMEOUT_MS);

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('error', handleError);
    signal.addEventListener('abort', handleAbort, { once: true });
    video.load();
  });
}

export function useScrollVideo({
  containerRef,
  videoRef,
  desktopSources,
  mobileSources,
  timelineDuration,
  openingIdleEnd = 0,
}: UseScrollVideoOptions) {
  const [progress, setProgress] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(MOBILE_UI_QUERY).matches,
  );
  const [usePortraitSource, setUsePortraitSource] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(PORTRAIT_SOURCE_QUERY).matches,
  );
  // effectiveType can fluctuate while a large video is downloading. Choose
  // the connection tier once per visit so that a mid-load 4G/3G estimate does
  // not abort one master and immediately start another.
  const [isConstrainedConnection] = useState(() =>
    connectionIsConstrained(getNetworkConnection()),
  );
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    loadProgress: null,
    ready: false,
    painted: false,
    error: null,
    activeSource: null,
  });

  const progressRef = useRef(0);
  const targetTimeRef = useRef(0);
  const smoothTimeRef = useRef(0);
  const mediaDurationRef = useRef(timelineDuration);
  const pendingSeekRef = useRef<number | null>(null);
  const lastSeekAtRef = useRef(0);
  const presentedTimeRef = useRef(0);
  const stableViewportRef = useRef({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 1 : window.innerHeight,
  });
  const paintedScheduledRef = useRef(false);
  const paintCleanupRef = useRef<(() => void) | null>(null);
  const touchCapableRef = useRef(isTouchCapableDevice());
  const mobileSourceLockedRef = useRef(
    touchCapableRef.current &&
      (isMobile || usePortraitSource || isConstrainedConnection),
  );

  const shouldUseMobileSource =
    isMobile ||
    usePortraitSource ||
    isConstrainedConnection ||
    mobileSourceLockedRef.current;

  useEffect(() => {
    const media = window.matchMedia(MOBILE_UI_QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    return subscribeToMediaQuery(media, update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(PORTRAIT_SOURCE_QUERY);
    const update = () => setUsePortraitSource(media.matches);
    update();
    return subscribeToMediaQuery(media, update);
  }, []);

  useEffect(() => {
    if (
      touchCapableRef.current &&
      (isMobile || usePortraitSource || isConstrainedConnection)
    ) {
      mobileSourceLockedRef.current = true;
    }
  }, [isConstrainedConnection, isMobile, usePortraitSource]);

  const cancelPaintTracking = useCallback(() => {
    const cleanup = paintCleanupRef.current;
    paintCleanupRef.current = null;
    if (cleanup) cleanup();
    paintedScheduledRef.current = false;
  }, []);

  const markPainted = useCallback(() => {
    if (paintedScheduledRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    const trackedVideo: HTMLVideoElement = video;

    const expectedSource = video.currentSrc || video.src;
    let cancelled = false;
    let videoFrameCallback: number | null = null;
    let firstAnimationFrame = 0;
    let secondAnimationFrame = 0;
    let paintTimeout = 0;
    let frameAvailabilityQueued = false;
    const startedAt = performance.now();

    const sourceIsCurrent = () =>
      videoRef.current === video &&
      (video.currentSrc || video.src) === expectedSource;
    const removeAvailabilityListeners = () => {
      video.removeEventListener('seeked', handleFrameAvailable);
      video.removeEventListener('loadeddata', handleFrameAvailable);
    };
    const clearResources = () => {
      removeAvailabilityListeners();
      if (
        videoFrameCallback !== null &&
        typeof video.cancelVideoFrameCallback === 'function'
      ) {
        video.cancelVideoFrameCallback(videoFrameCallback);
        videoFrameCallback = null;
      }
      if (firstAnimationFrame) {
        window.cancelAnimationFrame(firstAnimationFrame);
        firstAnimationFrame = 0;
      }
      if (secondAnimationFrame) {
        window.cancelAnimationFrame(secondAnimationFrame);
        secondAnimationFrame = 0;
      }
      if (paintTimeout) {
        window.clearTimeout(paintTimeout);
        paintTimeout = 0;
      }
    };
    const commitPainted = () => {
      if (cancelled || !sourceIsCurrent()) return;
      clearResources();
      paintCleanupRef.current = null;
      paintedScheduledRef.current = false;
      setLoadState((state) => ({ ...state, isLoading: false, loadProgress: 1, painted: true }));
    };
    const handlePaintTimeout = () => {
      if (trackedVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !trackedVideo.seeking) {
        commitPainted();
        return;
      }
      if (cancelled || !sourceIsCurrent()) return;

      // A direct network source may still be fetching the requested range.
      // The old 2.4-second decode deadline applied only to fully loaded Blobs.
      if (performance.now() - startedAt < FIRST_FRAME_TIMEOUT_MS) {
        paintTimeout = window.setTimeout(handlePaintTimeout, PAINT_CONFIRM_TIMEOUT_MS);
        return;
      }

      clearResources();
      paintCleanupRef.current = null;
      paintedScheduledRef.current = false;
      setLoadState((state) => ({
        ...state,
        isLoading: false,
        ready: false,
        painted: false,
        error:
          '브라우저가 첫 영상 프레임을 표시하지 못했습니다. 다시 시도해 주세요.',
      }));
    };
    function handleFrameAvailable() {
      if (
        frameAvailabilityQueued ||
        trackedVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        trackedVideo.seeking
      ) {
        return;
      }
      frameAvailabilityQueued = true;
      firstAnimationFrame = window.requestAnimationFrame(() => {
        firstAnimationFrame = 0;
        secondAnimationFrame = window.requestAnimationFrame(() => {
          secondAnimationFrame = 0;
          commitPainted();
        });
      });
    }

    paintedScheduledRef.current = true;

    video.addEventListener('seeked', handleFrameAvailable);
    video.addEventListener('loadeddata', handleFrameAvailable);

    if (typeof video.requestVideoFrameCallback === 'function') {
      videoFrameCallback = video.requestVideoFrameCallback(() => {
        videoFrameCallback = null;
        commitPainted();
      });
    }

    // Some Safari/WebView versions expose requestVideoFrameCallback but never
    // deliver it for a paused, seek-driven video. Keep media-event fallbacks
    // active and bound the wait so the poster cannot remain on top forever.
    paintTimeout = window.setTimeout(
      handlePaintTimeout,
      PAINT_CONFIRM_TIMEOUT_MS,
    );
    paintCleanupRef.current = () => {
      cancelled = true;
      clearResources();
    };
    handleFrameAvailable();
  }, [videoRef]);

  const applySeek = useCallback(
    (requestedTime: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      // Let the browser request an unbuffered range anywhere in this finite
      // movie; an early seekable range must not clamp a distant chapter jump.
      const nextTime = clamp(
        requestedTime,
        0,
        Math.max(0, video.duration - 0.025),
      );

      if (video.seeking) {
        pendingSeekRef.current = nextTime;
        // Coalesce small scrubs, but allow a new distant target to supersede
        // a slow network seek instead of waiting for an obsolete range.
        if (Math.abs(video.currentTime - nextTime) < 0.5 ||
          performance.now() - lastSeekAtRef.current < SEEK_RETARGET_INTERVAL_MS) return;
      }

      if (Math.abs(video.currentTime - nextTime) < 0.018) return;

      pendingSeekRef.current = null;
      lastSeekAtRef.current = performance.now();
      video.currentTime = nextTime;
    },
    [videoRef],
  );

  const retryLoad = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        presentedTimeRef.current = video.currentTime;
      }
      markPainted();
      const pending = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (pending !== null) applySeek(pending);
    };

    video.addEventListener('seeked', handleSeeked);
    return () => video.removeEventListener('seeked', handleSeeked);
  }, [applySeek, markPainted, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const controller = new AbortController();
    let disposed = false;
    let metadataReady = false;
    const preferredSources =
      shouldUseMobileSource && mobileSources.length > 0
        ? mobileSources
        : desktopSources;
    const candidates = preferredSources.filter((url) => {
      if (!url.endsWith('.webm')) return true;
      return video.canPlayType('video/webm; codecs="vp9"') !== '';
    });

    const load = async () => {
      cancelPaintTracking();
      setLoadState({
        isLoading: true,
        loadProgress: null,
        ready: false,
        painted: false,
        error: null,
        activeSource: null,
      });
      pendingSeekRef.current = null;
      lastSeekAtRef.current = 0;
      presentedTimeRef.current = 0;

      let finalError: Error | null = null;

      for (const source of candidates) {
        try {
          // Native range loading can decode the opening immediately and fetch
          // later chapters on demand without downloading the entire master.
          video.preload = 'auto';
          video.src = source;
          await waitForMetadata(video, controller.signal);
          if (disposed) return;

          metadataReady = true;
          mediaDurationRef.current = video.duration;
          const initialTime = progressRef.current * video.duration;
          targetTimeRef.current = initialTime;
          smoothTimeRef.current = initialTime;
          setDisplayedProgress(progressRef.current);
          video.currentTime = Math.min(initialTime, Math.max(0, video.duration - 0.025));

          setLoadState({
            isLoading: true,
            loadProgress: null,
            ready: true,
            painted: false,
            error: null,
            activeSource: source,
          });
          markPainted();
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          finalError =
            error instanceof Error ? error : new Error('영상 로딩에 실패했습니다.');
        }
      }

      if (!disposed) {
        setLoadState({
          isLoading: false,
          loadProgress: null,
          ready: false,
          painted: false,
          error:
            finalError?.message ??
            'master 영상이 아직 준비되지 않아 원본 장면을 표시합니다.',
          activeSource: null,
        });
      }
    };

    // Range requests can fail after metadata has already loaded. Preserve the
    // original-poster fallback and retry control for those failures as well.
    const handlePlaybackError = () => {
      if (disposed || !metadataReady) return;
      cancelPaintTracking();
      video.pause();
      setLoadState((state) => ({
        ...state, isLoading: false, ready: false, painted: false,
        error: '영상을 불러오지 못했습니다. 다시 시도해 주세요.',
      }));
    };
    video.addEventListener('error', handlePlaybackError);
    void load();

    return () => {
      disposed = true;
      controller.abort();
      video.removeEventListener('error', handlePlaybackError);
      cancelPaintTracking();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [
    cancelPaintTracking,
    desktopSources,
    loadAttempt,
    markPainted,
    mobileSources,
    shouldUseMobileSource,
    timelineDuration,
    videoRef,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const viewportHeight = stableViewportRef.current.height;
      const travel = Math.max(1, container.offsetHeight - viewportHeight);
      const nextProgress = clamp(-rect.top / travel);
      progressRef.current = nextProgress;
      targetTimeRef.current = nextProgress * mediaDurationRef.current;
      setProgress((previous) =>
        Math.abs(previous - nextProgress) > 0.00025 ? nextProgress : previous,
      );
    };
    const scheduleMeasure = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    const handleResize = () => {
      const widthChanged =
        Math.abs(window.innerWidth - stableViewportRef.current.width) > 2;

      // Mobile URL bars emit height-only resize events. Keeping the original
      // layout viewport prevents a visible jump in the scroll/video mapping.
      if (widthChanged || !isMobile) {
        stableViewportRef.current = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }
      scheduleMeasure();
    };

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    const handleContainerLoad = () => scheduleMeasure();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(container);
    } else {
      // Older WebViews lack ResizeObserver. Image/media load and DOM mutation
      // events cover the layout changes that affect the scroll travel length.
      container.addEventListener('load', handleContainerLoad, true);
      if (typeof MutationObserver !== 'undefined') {
        mutationObserver = new MutationObserver(scheduleMeasure);
        mutationObserver.observe(container, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
      void document.fonts?.ready.then(() => {
        if (!disposed) scheduleMeasure();
      });
    }
    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    measure();

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      container.removeEventListener('load', handleContainerLoad, true);
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [containerRef, isMobile]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let idleActive = false;
    let idleSeconds = 0;
    let takeoverFloor: number | null = null;
    let previousTarget = targetTimeRef.current;
    const resetClock = () => { last = performance.now(); };
    if (openingIdleEnd > 0) document.addEventListener('visibilitychange', resetClock);

    const tick = (now: number) => {
      const elapsed = Math.min(80, now - last);
      last = now;
      if (openingIdleEnd > 0 && document.hidden) {
        frame = window.requestAnimationFrame(tick);
        return;
      }

      const target = targetTimeRef.current;
      let current = smoothTimeRef.current;
      const atTop = progressRef.current === 0;
      const video = videoRef.current;
      if (openingIdleEnd > 0 && loadState.ready && video) {
        if (idleActive && !atTop) {
          // Handoff uses the currently displayed master, never a second layer.
          current = video.currentTime;
          takeoverFloor = current;
          pendingSeekRef.current = null;
          idleActive = false;
        }
        if (takeoverFloor !== null &&
          (target >= takeoverFloor || atTop || target < previousTarget - 0.0001)) {
          takeoverFloor = null;
        }
        if (!idleActive && atTop && current === 0 && !video.seeking &&
          pendingSeekRef.current === null && video.currentTime <= 1 / 30) {
          idleActive = true;
          idleSeconds = 0;
        }
      }
      previousTarget = target;
      const seekTarget = takeoverFloor === null ? target : Math.max(target, takeoverFloor);
      const smoothing = 1 - Math.exp(-elapsed / (isMobile ? 82 : 58));
      let next = current + (seekTarget - current) * smoothing;

      if (idleActive) {
        // One seek owner, eased 2.4s each way. Hidden tabs do not advance this clock.
        idleSeconds = (idleSeconds + elapsed / 1000) % 4.8;
        const end = Math.min(openingIdleEnd, Math.max(0, mediaDurationRef.current - 0.025));
        next = end * (1 - Math.cos(idleSeconds * Math.PI / 2.4)) / 2;
      } else if (Math.abs(seekTarget - next) < 0.012) next = seekTarget;
      smoothTimeRef.current = next;
      if (loadState.ready && video && !video.seeking &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        presentedTimeRef.current = video.currentTime;
      }
      // Captions/badges follow the decoded frame while an unbuffered seek is
      // pending. The previous picture stays visible instead of jumping ahead.
      const shownTime = loadState.ready ? presentedTimeRef.current : next;
      const nextDisplayedProgress = idleActive ? 0 : clamp(
        shownTime / Math.max(0.001, mediaDurationRef.current),
      );
      setDisplayedProgress((previous) =>
        idleActive ? 0 : Math.abs(previous - nextDisplayedProgress) > 0.00025
          ? nextDisplayedProgress
          : previous,
      );
      if (loadState.ready) applySeek(next);

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resetClock);
    };
  }, [applySeek, isMobile, loadState.ready, openingIdleEnd, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let primed = false;
    let priming = false;
    let disposed = false;

    const prime = async () => {
      if (disposed || primed || priming || !loadState.ready) return;
      priming = true;
      const requestedTime = targetTimeRef.current;

      try {
        video.muted = true;
        await video.play();
        if (disposed) return;
        video.pause();
        primed = true;
        const desiredTime = openingIdleEnd > 0 ? smoothTimeRef.current : requestedTime;
        smoothTimeRef.current = desiredTime;
        applySeek(desiredTime);
        markPainted();
        window.removeEventListener('pointerdown', prime);
        window.removeEventListener('touchstart', prime);
      } catch {
        // Keep the listeners: a later genuine user gesture can prime iOS Safari.
      } finally {
        priming = false;
      }
    };

    window.addEventListener('pointerdown', prime, { passive: true });
    window.addEventListener('touchstart', prime, { passive: true });
    // Modern browsers allow muted inline playback without a gesture. Prime as
    // soon as native video metadata is ready, while keeping the gesture
    // listeners as the iOS/WebView fallback when this attempt is rejected.
    void prime();
    return () => {
      disposed = true;
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('touchstart', prime);
    };
  }, [applySeek, loadState.ready, markPainted, openingIdleEnd, videoRef]);

  const scrollToTimelineTime = useCallback(
    (time: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;
      const top = window.scrollY + container.getBoundingClientRect().top;
      const travel = Math.max(
        1,
        container.offsetHeight - stableViewportRef.current.height,
      );
      const destination = top + clamp(time / timelineDuration) * travel;
      window.scrollTo({ top: destination, behavior });
    },
    [containerRef, timelineDuration],
  );

  return {
    progress,
    timelineTime: displayedProgress * timelineDuration,
    isMobile,
    usePortraitSource,
    shouldUseMobileSource,
    isConstrainedConnection,
    retryLoad,
    scrollToTimelineTime,
    ...loadState,
  };
}
