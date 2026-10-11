import { useRef } from 'react';
import {
  MOBILE_CINEMATIC_DURATION,
  MOBILE_CINEMATIC_ENDING_START,
  MOBILE_CINEMATIC_MASTER,
  MOBILE_CINEMATIC_OPENING_IDLE_END,
  MOBILE_CINEMATIC_OPENING_POSTER,
  mobileCinematicCategories,
  mobileCinematicSceneAtTime,
  mobileCinematicScenes,
} from '../data/mobileCinematic';
import { useScrollVideo } from '../hooks/useScrollVideo';
import { EnterHomepage } from './EndSequence';
import { LoadingScreen } from './LoadingScreen';
import { MotionPreferenceControl } from './MotionPreferenceControl';
import { MobileOpeningLettering } from './MobileOpeningLettering';
import { PosterStack } from './PosterStack';
import { ProgressIndicator } from './ProgressIndicator';
import { CinematicAwardBadge } from './CinematicAwardBadge';
import '../styles/mobile-cinematic.css';

type MobileCinematicWorldProps = {
  onEnter: () => void;
  onReturnToStatic?: () => void;
};

export function MobileCinematicWorld({ onEnter, onReturnToStatic }: MobileCinematicWorldProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    progress, timelineTime, ready, painted, isLoading, loadProgress, error,
    retryLoad, scrollToTimelineTime,
  } = useScrollVideo({
    containerRef, videoRef,
    // A landscape phone and a slow connection still get the same portrait film.
    desktopSources: MOBILE_CINEMATIC_MASTER,
    mobileSources: MOBILE_CINEMATIC_MASTER,
    timelineDuration: MOBILE_CINEMATIC_DURATION,
    openingIdleEnd: MOBILE_CINEMATIC_OPENING_IDLE_END,
  });

  const scene = mobileCinematicSceneAtTime(timelineTime);
  const sceneIndex = mobileCinematicScenes.indexOf(scene);
  const nearbyPosters = mobileCinematicScenes.filter((_, index) => Math.abs(index - sceneIndex) <= 1);
  const videoVisible = ready && painted;
  const atEnding = timelineTime >= MOBILE_CINEMATIC_ENDING_START;

  return (
    <>
      <h1 className="sr-only">돌 AI연구소 DOL AI LAB 모바일 소개</h1>
      <section className="scroll-world mobile-cinematic" id="journey-start" ref={containerRef}
        data-intro-version="mobile-v3" data-active-scene={scene.id} data-tone={scene.tone}
        data-timeline-time={timelineTime.toFixed(2)} aria-label="돌 AI연구소 모바일 스크롤 여정">
        <div className="scroll-world__sticky">
          <div className="mobile-cinematic__backdrop" aria-hidden="true"
            style={{ backgroundImage: `url("${scene.sourceImage}")` }} />
          <div className="mobile-cinematic__stage">
            <PosterStack scenes={nearbyPosters} activeId={scene.id} isMobile usePortraitSource />
            <video ref={videoRef}
              className={`world-film mobile-cinematic__film${videoVisible ? ' is-visible' : ''}`}
              data-source-variant="mobile" data-intro-version="mobile-v3"
              poster={MOBILE_CINEMATIC_OPENING_POSTER}
              preload="metadata" muted playsInline disablePictureInPicture aria-hidden="true" />
            <MobileOpeningLettering sourceImage="/generated/intro-v2/posters/mobile/scene01.png"
              timelineTime={timelineTime} visible={videoVisible} videoRef={videoRef} />
            <CinematicAwardBadge sceneId={scene.id} />
          {atEnding ? (
            <section className="mobile-cinematic__ending" aria-label="홈페이지로 이동">
              <EnterHomepage onEnter={onEnter} />
            </section>
          ) : (
            <div className="mobile-cinematic__navigation">
              <section className="mobile-cinematic__story" aria-live="polite" aria-atomic="true"
                aria-labelledby="mobile-cinematic-title" data-story-scene={scene.id}>
                <p className="mobile-cinematic__category">
                  <span aria-hidden="true">{String(scene.order).padStart(2, '0')}</span>
                  {mobileCinematicCategories[scene.id]}
                </p>
                <h2 id="mobile-cinematic-title">{scene.title}</h2>
                <p className="mobile-cinematic__description">{scene.subtitle}</p>
              </section>
              <ProgressIndicator scenes={mobileCinematicScenes} activeId={scene.id} progress={progress}
                onSelect={(selected) => scrollToTimelineTime(selected.startTime)} />
            </div>
          )}
          </div>

          <LoadingScreen isLoading={isLoading} progress={loadProgress} error={error} onRetry={retryLoad} />
          {onReturnToStatic && <MotionPreferenceControl mode="animated" onChange={onReturnToStatic} />}
          <div className={`mobile-cinematic__scroll-cue${progress > 0.035 ? ' is-hidden' : ''}`} aria-hidden="true">
            아래로 스크롤 <span>↓</span>
          </div>
          <p className="sr-only">아래로 스크롤하면 금빛을 따라 일곱 장면이 이어집니다. 위로 스크롤하면 이전 장면으로 돌아갑니다.</p>
          <div className="master-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
        </div>
      </section>
    </>
  );
}

type MobileCinematicStaticProps = {
  onEnter: () => void;
  onEnableAnimation: () => void;
};

export function MobileCinematicStatic({ onEnter, onEnableAnimation }: MobileCinematicStaticProps) {
  return (
    <div className="mobile-cinematic-static" id="journey-start" data-intro-version="mobile-v3">
      <h1 className="sr-only">돌 AI연구소 DOL AI LAB 모바일 소개</h1>
      <p className="sr-only">움직임 줄이기 설정에 따라 일곱 장면을 원본 그림으로 보여드립니다.</p>
      <MotionPreferenceControl mode="static" onChange={onEnableAnimation} />
      {mobileCinematicScenes.map((scene, index) => (
        <section className="mobile-cinematic-static__scene" key={scene.id}
          aria-labelledby={`mobile-static-${scene.id}`}>
          <img src={scene.sourceImage} alt={scene.alt} loading={index === 0 ? 'eager' : 'lazy'} />
          <div className="mobile-cinematic-static__copy">
            <h2 id={`mobile-static-${scene.id}`}>{scene.title}</h2>
            <p>{scene.subtitle}</p>
          </div>
          {index === mobileCinematicScenes.length - 1 && <EnterHomepage onEnter={onEnter} />}
        </section>
      ))}
    </div>
  );
}
