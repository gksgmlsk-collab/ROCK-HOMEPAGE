import { type CSSProperties, useEffect, useRef, useState } from 'react';

type IntroAmbientVideoProps = {
  active: boolean;
  contained: boolean;
  opacity: number;
  poster: string;
  src: string;
};

export function IntroAmbientVideo({
  active,
  contained,
  opacity,
  poster,
  src,
}: IntroAmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [painted, setPainted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPainted(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    const play = () => {
      if (!active || document.hidden) return;
      video.muted = true;
      void video.play().catch(() => {
        // Muted autoplay can still be blocked in low-power or older iOS modes.
        // The poster/master remain visible, and a later real gesture retries.
      });
    };
    const handleVisibility = () => {
      if (document.hidden || !active) {
        video.pause();
      } else {
        play();
      }
    };

    if (active) {
      play();
      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('pointerdown', play, { passive: true });
      window.addEventListener('touchstart', play, { passive: true });
    } else {
      video.pause();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pointerdown', play);
      window.removeEventListener('touchstart', play);
    };
  }, [active, failed]);

  const markPainted = () => {
    const video = videoRef.current;
    if (!video || painted) return;

    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(() => setPainted(true));
    } else {
      window.requestAnimationFrame(() => setPainted(true));
    }
  };

  return (
    <video
      ref={videoRef}
      className={[
        'intro-loop',
        painted && !failed ? 'is-painted' : '',
        contained ? 'is-mobile-contained' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--intro-loop-opacity': painted && !failed ? opacity : 0,
        } as CSSProperties
      }
      src={src}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      tabIndex={-1}
      aria-hidden="true"
      onLoadedData={markPainted}
      onPlaying={markPainted}
      onError={() => setFailed(true)}
    />
  );
}
