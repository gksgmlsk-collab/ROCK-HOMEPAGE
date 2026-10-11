import { type CSSProperties, useRef } from 'react';
import {
  DESKTOP_CINEMATIC_DURATION,
  DESKTOP_CINEMATIC_ENDING_START,
  DESKTOP_CINEMATIC_LOGO,
  DESKTOP_CINEMATIC_MASTER,
  desktopCinematicSceneAtTime,
  desktopCinematicScenes,
} from '../data/desktopCinematic';
import { useScrollVideo } from '../hooks/useScrollVideo';
import { EnterHomepage } from './EndSequence';
import { LoadingScreen } from './LoadingScreen';
import { MotionPreferenceControl } from './MotionPreferenceControl';
import { OpeningLettering } from './OpeningLettering';
import { PosterStack } from './PosterStack';
import { ProgressIndicator } from './ProgressIndicator';
import { SceneOverlay } from './SceneOverlay';
import { CinematicAwardBadge } from './CinematicAwardBadge';

type DesktopCinematicWorldProps = {
  onEnter: () => void;
  onReturnToStatic?: () => void;
};

export function DesktopCinematicWorld({ onEnter, onReturnToStatic }: DesktopCinematicWorldProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    progress, timelineTime, ready, painted, isLoading, loadProgress, error,
    retryLoad, scrollToTimelineTime,
  } = useScrollVideo({
    containerRef, videoRef,
    // The desktop journey stays the desktop journey on a slow connection too.
    desktopSources: DESKTOP_CINEMATIC_MASTER,
    mobileSources: DESKTOP_CINEMATIC_MASTER,
    timelineDuration: DESKTOP_CINEMATIC_DURATION,
    openingIdleEnd: 0.85,
  });

  const scene = desktopCinematicSceneAtTime(timelineTime);
  const sceneIndex = desktopCinematicScenes.indexOf(scene);
  const nearbyPosters = desktopCinematicScenes.filter((_, index) => Math.abs(index - sceneIndex) <= 1);
  const videoVisible = ready && painted;
  const atEnding = timelineTime >= DESKTOP_CINEMATIC_ENDING_START;

  return (
    <>
      <h1 className="sr-only">돌 AI연구소 DOL AI LAB 공식 소개</h1>
      <section
        className="scroll-world desktop-cinematic"
        id="journey-start"
        ref={containerRef}
        data-intro-version="desktop-v3"
        data-active-scene={scene.id}
        data-timeline-time={timelineTime.toFixed(2)}
        aria-label="돌 AI연구소 스크롤 여정"
      >
        <div className="scroll-world__sticky">
          <PosterStack scenes={nearbyPosters} activeId={scene.id} isMobile={false} usePortraitSource={false} />
          <video
            ref={videoRef}
            className={`world-film${videoVisible ? ' is-visible' : ''}`}
            data-source-variant="desktop"
            data-intro-version="desktop-v3"
            poster={desktopCinematicScenes[0].sourceImage}
            preload="metadata" muted playsInline disablePictureInPicture aria-hidden="true"
          />

          <div className="world-vignette" aria-hidden="true" />
          <OpeningLettering sourceImage={desktopCinematicScenes[0].sourceImage}
            timelineTime={timelineTime} visible={videoVisible} videoRef={videoRef} />
          {sceneIndex !== 0 && <SceneOverlay scene={scene} timelineTime={timelineTime} />}
          <CinematicAwardBadge sceneId={scene.id} />

          {atEnding && (
            <section className="desktop-cinematic-ending" aria-label="돌 AI연구소 홈페이지로 이동">
              {!videoVisible && <img className="desktop-cinematic-ending__fallback" src={DESKTOP_CINEMATIC_LOGO} alt="돌 AI연구소 DOL AI LAB" />}
              <h2 className="sr-only">돌 AI연구소 DOL AI LAB</h2>
              <div className="desktop-cinematic-ending__entry">
                <EnterHomepage onEnter={onEnter} />
              </div>
            </section>
          )}

          <LoadingScreen isLoading={isLoading} progress={loadProgress} error={error} onRetry={retryLoad} />
          {onReturnToStatic && <MotionPreferenceControl mode="animated" onChange={onReturnToStatic} />}
          {!atEnding && (
            <ProgressIndicator
              scenes={desktopCinematicScenes} activeId={scene.id} progress={progress}
              onSelect={(selected) => scrollToTimelineTime(selected.startTime)}
            />
          )}

          <div className={`scroll-cue${progress > 0.055 ? ' is-hidden' : ''}`} aria-hidden="true">
            <div className="scroll-cue__badge">
              <span className="scroll-cue__mouse"><i /></span>
              <span className="scroll-cue__copy"><strong>아래로 스크롤</strong><small>돌봇과 함께 떠나는 학교 여행</small></span>
              <span className="scroll-cue__arrow">↓</span>
            </div>
          </div>
          <p className="sr-only">아래로 스크롤하면 돌봇과 금빛을 따라 여섯 장면을 둘러봅니다. 위로 스크롤하면 이전 장면으로 돌아갑니다.</p>
          <div className="master-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
        </div>
      </section>
    </>
  );
}

type DesktopCinematicStaticProps = {
  onEnter: () => void;
  onEnableAnimation: () => void;
};

export function DesktopCinematicStatic({ onEnter, onEnableAnimation }: DesktopCinematicStaticProps) {
  return (
    <div className="reduced-world desktop-cinematic-static" id="journey-start" data-intro-version="desktop-v3">
      <h1 className="sr-only">돌 AI연구소 DOL AI LAB 공식 소개</h1>
      <p className="sr-only">움직임 줄이기 설정에 따라 여섯 장면의 원본 그림과 설명을 순서대로 제공합니다.</p>
      <MotionPreferenceControl mode="static" onChange={onEnableAnimation} />
      {desktopCinematicScenes.map((scene, index) => (
        <section className={`reduced-scene reduced-scene--${scene.tone}`} key={scene.id} aria-labelledby={`desktop-static-${scene.id}`}>
          <picture><img src={scene.sourceImage} alt={scene.alt} loading={index === 0 ? 'eager' : 'lazy'} /></picture>
          <div className="reduced-scene__copy" style={{ '--scene-copy-accent': scene.accent } as CSSProperties}>
            <h2 id={`desktop-static-${scene.id}`}>{scene.title}</h2><p>{scene.subtitle}</p>
          </div>
        </section>
      ))}
      <section className="desktop-cinematic-static__ending" aria-label="돌 AI연구소 홈페이지로 이동">
        <img src={DESKTOP_CINEMATIC_LOGO} alt="돌 AI연구소 DOL AI LAB" loading="lazy" />
        <div className="desktop-cinematic-ending__entry"><EnterHomepage onEnter={onEnter} /></div>
      </section>
    </div>
  );
}
