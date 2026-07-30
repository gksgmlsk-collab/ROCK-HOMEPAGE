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
};

type LoadState = {
  isLoading: boolean;
  loadProgress: number | null;
  ready: boolean;
  painted: boolean;
  error: string | null;
  activeSource: string | null;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const MOBILE_UI_QUERY = '(max-width: 860px), (pointer: coarse)';
const PORTRAIT_SOURCE_QUERY =
  '(orientation: portrait) and (max-width: 1024px)';

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

function fetchBlob(
  url: string,
  signal: AbortSignal,
  onProgress: (progress: number | null) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'blob';

    request.onprogress = (event) => {
      onProgress(event.lengthComputable ? event.loaded / event.total : null);
    };
    request.onerror = () => reject(new Error(`영상을 불러오지 못했습니다: ${url}`));
    request.onabort = () =>
      reject(new DOMException('영상 로딩이 취소되었습니다.', 'AbortError'));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300 && request.response) {
        onProgress(1);
        resolve(request.response);
        return;
      }

      reject(new Error(`영상 파일을 찾을 수 없습니다 (${request.status}): ${url}`));
    };

    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    request.send();
  });
}

function waitForMetadata(video: HTMLVideoElement, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const clear = () => {
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
  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    loadProgress: 0,
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
  const lastAppliedTimeRef = useRef(-1);
  const objectUrlRef = useRef<string | null>(null);
  const stableViewportRef = useRef({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 1 : window.innerHeight,
  });
  const paintedScheduledRef = useRef(false);
  const paintCleanupRef = useRef<(() => void) | null>(null);

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

    const expectedSource = video.currentSrc || video.src;
    let cancelled = false;
    let videoFrameCallback: number | null = null;
    let firstAnimationFrame = 0;
    let secondAnimationFrame = 0;

    const sourceIsCurrent = () =>
      videoRef.current === video &&
      (video.currentSrc || video.src) === expectedSource;
    const commitPainted = () => {
      if (cancelled || !sourceIsCurrent()) return;
      paintCleanupRef.current = null;
      paintedScheduledRef.current = false;
      setLoadState((state) => ({ ...state, painted: true }));
    };

    paintedScheduledRef.current = true;

    if (typeof video.requestVideoFrameCallback === 'function') {
      videoFrameCallback = video.requestVideoFrameCallback(() => {
        videoFrameCallback = null;
        commitPainted();
      });
      paintCleanupRef.current = () => {
        cancelled = true;
        if (
          videoFrameCallback !== null &&
          typeof video.cancelVideoFrameCallback === 'function'
        ) {
          video.cancelVideoFrameCallback(videoFrameCallback);
        }
      };
      return;
    }

    let frameAvailabilityHandled = false;
    const removeAvailabilityListeners = () => {
      video.removeEventListener('seeked', handleFrameAvailable);
      video.removeEventListener('loadeddata', handleFrameAvailable);
    };
    const handleFrameAvailable = () => {
      if (
        frameAvailabilityHandled ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.seeking
      ) {
        return;
      }
      frameAvailabilityHandled = true;
      removeAvailabilityListeners();
      firstAnimationFrame = window.requestAnimationFrame(() => {
        secondAnimationFrame = window.requestAnimationFrame(commitPainted);
      });
    };

    video.addEventListener('seeked', handleFrameAvailable);
    video.addEventListener('loadeddata', handleFrameAvailable);
    paintCleanupRef.current = () => {
      cancelled = true;
      removeAvailabilityListeners();
      if (firstAnimationFrame) window.cancelAnimationFrame(firstAnimationFrame);
      if (secondAnimationFrame) window.cancelAnimationFrame(secondAnimationFrame);
    };
    handleFrameAvailable();
  }, [videoRef]);

  const applySeek = useCallback(
    (requestedTime: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const seekableEnd =
        video.seekable.length > 0
          ? video.seekable.end(video.seekable.length - 1)
          : video.duration;
      const nextTime = clamp(
        requestedTime,
        0,
        Math.max(0, Math.min(video.duration, seekableEnd) - 0.025),
      );

      if (video.seeking) {
        pendingSeekRef.current = nextTime;
        return;
      }

      if (
        Math.abs(video.currentTime - nextTime) < 0.018 ||
        Math.abs(lastAppliedTimeRef.current - nextTime) < 0.018
      ) {
        return;
      }

      lastAppliedTimeRef.current = nextTime;
      video.currentTime = nextTime;
    },
    [videoRef],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
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
    const candidates = (
      usePortraitSource ? mobileSources : desktopSources
    ).filter((url) => {
      if (!url.endsWith('.webm')) return true;
      return video.canPlayType('video/webm; codecs="vp9"') !== '';
    });

    const load = async () => {
      cancelPaintTracking();
      setLoadState({
        isLoading: true,
        loadProgress: 0,
        ready: false,
        painted: false,
        error: null,
        activeSource: null,
      });
      pendingSeekRef.current = null;
      lastAppliedTimeRef.current = -1;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      let finalError: Error | null = null;

      for (const source of candidates) {
        let candidateUrl: string | null = null;
        try {
          const blob = await fetchBlob(
            source,
            controller.signal,
            (nextProgress) => {
              if (!disposed) {
                setLoadState((state) => ({
                  ...state,
                  loadProgress: nextProgress,
                }));
              }
            },
          );
          if (disposed) return;

          candidateUrl = URL.createObjectURL(blob);
          video.src = candidateUrl;
          await waitForMetadata(video, controller.signal);
          if (disposed) return;

          objectUrlRef.current = candidateUrl;
          candidateUrl = null;
          mediaDurationRef.current = video.duration;
          const initialTime = progressRef.current * video.duration;
          targetTimeRef.current = initialTime;
          smoothTimeRef.current = initialTime;
          setDisplayedProgress(progressRef.current);
          video.currentTime = Math.min(initialTime, Math.max(0, video.duration - 0.025));

          setLoadState({
            isLoading: false,
            loadProgress: 1,
            ready: true,
            painted: false,
            error: null,
            activeSource: source,
          });
          markPainted();
          return;
        } catch (error) {
          if (candidateUrl) URL.revokeObjectURL(candidateUrl);
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

    void load();

    return () => {
      disposed = true;
      controller.abort();
      cancelPaintTracking();
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [
    cancelPaintTracking,
    desktopSources,
    markPainted,
    mobileSources,
    timelineDuration,
    usePortraitSource,
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

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(container);
    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    measure();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [containerRef, isMobile]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(80, now - last);
      last = now;

      const target = targetTimeRef.current;
      const current = smoothTimeRef.current;
      const smoothing = 1 - Math.exp(-elapsed / (isMobile ? 82 : 58));
      let next = current + (target - current) * smoothing;

      if (Math.abs(target - next) < 0.012) next = target;
      smoothTimeRef.current = next;
      const nextDisplayedProgress = clamp(
        next / Math.max(0.001, mediaDurationRef.current),
      );
      setDisplayedProgress((previous) =>
        Math.abs(previous - nextDisplayedProgress) > 0.00025
          ? nextDisplayedProgress
          : previous,
      );
      if (loadState.ready) applySeek(next);

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [applySeek, isMobile, loadState.ready]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let primed = false;

    const prime = async () => {
      if (primed || !loadState.ready) return;
      const desiredTime = targetTimeRef.current;

      try {
        video.muted = true;
        await video.play();
        video.pause();
        primed = true;
        smoothTimeRef.current = desiredTime;
        applySeek(desiredTime);
        markPainted();
        window.removeEventListener('pointerdown', prime);
        window.removeEventListener('touchstart', prime);
      } catch {
        // Keep the listeners: a later genuine user gesture can prime iOS Safari.
      }
    };

    window.addEventListener('pointerdown', prime, { passive: true });
    window.addEventListener('touchstart', prime, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('touchstart', prime);
    };
  }, [applySeek, loadState.ready, markPainted, videoRef]);

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
    scrollToTimelineTime,
    ...loadState,
  };
}
