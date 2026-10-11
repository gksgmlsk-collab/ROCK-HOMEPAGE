import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  INTRO_LOOP_VIDEO,
  MASTER_VIDEO,
  TIMELINE_DURATION,
  sceneAtTime,
  scenes,
} from '../data/scenes';
import { useScrollVideo } from '../hooks/useScrollVideo';
import { EndSequence } from './EndSequence';
import { DesktopCinematicStatic, DesktopCinematicWorld } from './DesktopCinematicWorld';
import { MobileCinematicStatic, MobileCinematicWorld } from './MobileCinematicWorld';
import { IntroAmbientVideo } from './IntroAmbientVideo';
import { LoadingScreen } from './LoadingScreen';
import { MotionPreferenceControl } from './MotionPreferenceControl';
import { PosterStack } from './PosterStack';
import { ProgressIndicator } from './ProgressIndicator';
import { SceneOverlay } from './SceneOverlay';

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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    return subscribeToMediaQuery(media, update);
  }, []);

  return reduced;
}

// Phones/tablets retain their portrait journey, including landscape phones.
const DESKTOP_CINEMATIC_QUERY = '(min-width: 861px) and (hover: hover) and (pointer: fine)';

function useDesktopCinematic() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(DESKTOP_CINEMATIC_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_CINEMATIC_QUERY);
    const update = () => setDesktop(media.matches);
    update();
    return subscribeToMediaQuery(media, update);
  }, []);
  return desktop;
}

const MOTION_OVERRIDE_KEY = 'dol-ai-lab-motion-override';

function readMotionOverride() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(MOTION_OVERRIDE_KEY) === 'animated';
  } catch {
    return false;
  }
}

function useMotionOverride() {
  const [animatedOverride, setAnimatedOverride] = useState(readMotionOverride);

  const enableAnimation = () => {
    setAnimatedOverride(true);
    try {
      window.localStorage.setItem(MOTION_OVERRIDE_KEY, 'animated');
    } catch {
      // Storage can be unavailable in private or embedded browsing contexts.
    }
  };

  const followSystemPreference = () => {
    setAnimatedOverride(false);
    try {
      window.localStorage.removeItem(MOTION_OVERRIDE_KEY);
    } catch {
      // The in-memory choice still takes effect for this visit.
    }
  };

  useEffect(() => {
    document.documentElement.dataset.motionPreference = animatedOverride
      ? 'animated'
      : 'system';

    return () => {
      delete document.documentElement.dataset.motionPreference;
    };
  }, [animatedOverride]);

  return { animatedOverride, enableAnimation, followSystemPreference };
}

const smoothstep = (value: number) => {
  const normalized = Math.min(1, Math.max(0, value));
  return normalized * normalized * (3 - 2 * normalized);
};

function getOriginalFrameOpacity(
  timelineTime: number,
  scene: ReturnType<typeof sceneAtTime>,
) {
  if (scene.preferMotion) return 0;
  if (timelineTime < scene.startTime || timelineTime > scene.endTime) return 0;

  const sceneProgress =
    (timelineTime - scene.startTime) / (scene.endTime - scene.startTime);
  const fadeIn = smoothstep((sceneProgress - 0.31) / 0.04);
  const fadeOut = 1 - smoothstep((sceneProgress - 0.65) / 0.04);

  return Math.min(fadeIn, fadeOut);
}

export function ScrollWorld({ onEnter }: { onEnter: () => void }) {
  const reducedMotion = usePrefersReducedMotion();
  const desktopCinematic = useDesktopCinematic();
  const { animatedOverride, enableAnimation, followSystemPreference } =
    useMotionOverride();

  if (desktopCinematic) {
    return reducedMotion && !animatedOverride ? (
      <DesktopCinematicStatic onEnter={onEnter} onEnableAnimation={enableAnimation} />
    ) : (
      <DesktopCinematicWorld onEnter={onEnter} onReturnToStatic={reducedMotion ? followSystemPreference : undefined} />
    );
  }

  return reducedMotion && !animatedOverride ? (
    <MobileCinematicStatic onEnableAnimation={enableAnimation} onEnter={onEnter} />
  ) : (
    <MobileCinematicWorld
      onEnter={onEnter}
      onReturnToStatic={reducedMotion ? followSystemPreference : undefined}
    />
  );
}

type AnimatedScrollWorldProps = {
  onEnter: () => void;
  onReturnToStatic?: () => void;
};

export function AnimatedScrollWorld({ onReturnToStatic, onEnter }: AnimatedScrollWorldProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const enabledScenes = useMemo(
    () => scenes.filter((scene) => scene.enabled),
    [],
  );
  const {
    progress,
    timelineTime,
    isMobile,
    usePortraitSource,
    shouldUseMobileSource,
    isLoading,
    loadProgress,
    ready,
    painted,
    error,
    retryLoad,
    scrollToTimelineTime,
  } = useScrollVideo({
    containerRef,
    videoRef,
    desktopSources: MASTER_VIDEO.desktop,
    mobileSources: MASTER_VIDEO.mobile,
    timelineDuration: TIMELINE_DURATION,
  });

  const activeScene = sceneAtTime(timelineTime);
  const videoVisible = ready && painted;
  const introFallbackActive =
    !videoVisible && timelineTime <= enabledScenes[0].endTime;
  const introLoopOpacity = introFallbackActive
    ? 1
    : 1 - smoothstep(progress / 0.022);
  const introLoopActive = introFallbackActive || progress < 0.055;
  const originalFrameOpacity = getOriginalFrameOpacity(
    timelineTime,
    activeScene,
  );

  return (
    <>
      <h1 className="sr-only">돌 AI연구소 DOL AI LAB 공식 소개</h1>
      <section
        className="scroll-world"
        id="journey-start"
        ref={containerRef}
        aria-label="돌 AI연구소 스크롤 여정"
      >
        <div className="scroll-world__sticky">
          <PosterStack
            scenes={enabledScenes}
            activeId={activeScene.id}
            isMobile={isMobile}
            usePortraitSource={usePortraitSource}
          />

          <video
            ref={videoRef}
            data-source-variant={shouldUseMobileSource ? 'mobile' : 'desktop'}
            className={[
              'world-film',
              videoVisible ? 'is-visible' : '',
              isMobile || usePortraitSource ? 'is-mobile-contained' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              {
                '--world-film-opacity': 1 - originalFrameOpacity,
              } as CSSProperties
            }
            poster={
              usePortraitSource
                ? enabledScenes[0].mobileSourceImage
                : enabledScenes[0].sourceImage
            }
            preload="metadata"
            muted
            playsInline
            disablePictureInPicture
            aria-hidden="true"
          />

          <IntroAmbientVideo
            active={introLoopActive}
            contained={isMobile || usePortraitSource}
            opacity={introLoopOpacity}
            poster={
              usePortraitSource
                ? enabledScenes[0].mobileSourceImage
                : enabledScenes[0].sourceImage
            }
            src={
              shouldUseMobileSource
                ? INTRO_LOOP_VIDEO.mobile
                : INTRO_LOOP_VIDEO.desktop
            }
          />

          <div className="world-vignette" aria-hidden="true" />
          <div className="world-grain" aria-hidden="true" />

          <SceneOverlay scene={activeScene} timelineTime={timelineTime} />
          <EndSequence timelineTime={timelineTime} onEnter={onEnter} />

          <LoadingScreen
            isLoading={isLoading}
            progress={loadProgress}
            error={error}
            onRetry={retryLoad}
          />

          {onReturnToStatic && (
            <MotionPreferenceControl
              mode="animated"
              onChange={onReturnToStatic}
            />
          )}

          <ProgressIndicator
            scenes={enabledScenes}
            activeId={activeScene.id}
            progress={progress}
            onSelect={(scene) => scrollToTimelineTime(scene.startTime)}
          />

          <div
            className={`scroll-cue${progress > 0.055 ? ' is-hidden' : ''}`}
            aria-hidden="true"
          >
            <div className="scroll-cue__badge">
              <span className="scroll-cue__mouse">
                <i />
              </span>
              <span className="scroll-cue__copy">
                <strong>아래로 스크롤</strong>
                <small>돌 AI연구소 둘러보기</small>
              </span>
              <span className="scroll-cue__arrow">↓</span>
            </div>
          </div>
          <p className="sr-only">
            아래로 스크롤하면 돌 AI연구소의 다섯 장면을 영상으로 둘러볼 수
            있습니다.
          </p>

          <div className="master-progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </section>
    </>
  );
}
