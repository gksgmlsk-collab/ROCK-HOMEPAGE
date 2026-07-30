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
import { IntroAmbientVideo } from './IntroAmbientVideo';
import { LoadingScreen } from './LoadingScreen';
import { PosterStack } from './PosterStack';
import { ProgressIndicator } from './ProgressIndicator';
import { ReducedMotionExperience } from './ReducedMotionExperience';
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

export function ScrollWorld() {
  const reducedMotion = usePrefersReducedMotion();

  return reducedMotion ? <ReducedMotionExperience /> : <AnimatedScrollWorld />;
}

function AnimatedScrollWorld() {
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
    isLoading,
    loadProgress,
    ready,
    painted,
    error,
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
  const introLoopOpacity = 1 - smoothstep(progress / 0.022);
  const introLoopActive = progress < 0.055;
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
            src={INTRO_LOOP_VIDEO}
          />

          <div className="world-vignette" aria-hidden="true" />
          <div className="world-grain" aria-hidden="true" />

          <SceneOverlay scene={activeScene} timelineTime={timelineTime} />
          <EndSequence timelineTime={timelineTime} />

          <LoadingScreen
            isLoading={isLoading}
            progress={loadProgress}
            error={error}
          />

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
