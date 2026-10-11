import { type SyntheticEvent, useState } from 'react';
import '../styles/mobile-opening-welcome.css';

type MobileOpeningWelcomeProps = {
  /** Presented timeline time; the opening idle deliberately remains at zero. */
  timelineTime: number;
  sourceImage: string;
  onImageReady?: (success: boolean) => void;
};

function smoothstep(value: number) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

/** A whole original frame hands off under an opaque wash, never a body crossfade. */
export function MobileOpeningWelcome({ timelineTime, sourceImage, onImageReady }: MobileOpeningWelcomeProps) {
  const [readySource, setReadySource] = useState<string | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const time = Number.isFinite(timelineTime) ? Math.max(0, timelineTime) : 0;
  const imageReady = readySource === sourceImage;
  const imageFailed = failedSource === sourceImage;
  const visible = imageReady && !imageFailed && time < .5;

  const handleImageLoad = async (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const loadedSource = image.currentSrc || image.src;
    // onLoad alone can precede complete presentation of a progressive image.
    // Keep the original cover hidden until the browser has decoded its pixels.
    try { await image.decode(); } catch { /* onLoad + naturalWidth is the fallback for older decoders. */ }
    if (!image.isConnected || (image.currentSrc || image.src) !== loadedSource) return;
    const success = image.complete && image.naturalWidth > 0;
    if (success) setReadySource(sourceImage);
    else setFailedSource(sourceImage);
    onImageReady?.(success);
  };

  const handleImageError = () => {
    setFailedSource(sourceImage);
    onImageReady?.(false);
  };

  const showOriginal = time < .25;
  // Hold the fully opaque peak across several 30fps frames so the artwork
  // switch is concealed in both scroll directions, including coarse seeks.
  const washOpacity = time < .2
    ? smoothstep((time - .1) / .1)
    : time <= .3 ? 1 : 1 - smoothstep((time - .3) / .15);

  return (
    <div className="mobile-opening-welcome" aria-hidden="true"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
      data-timeline-time={time.toFixed(3)}
      data-image-state={imageFailed ? 'failed' : imageReady ? 'ready' : 'loading'}
      data-original-visible={visible && showOriginal ? 'true' : 'false'}
      data-wash-opacity={washOpacity.toFixed(3)}>
      <div className="mobile-opening-welcome__original"
        style={{ visibility: visible && showOriginal ? 'visible' : 'hidden' }}>
        {/* Stay mounted after the opening so late loads settle and reverse scroll reuses the decoded image. */}
        <img src={sourceImage} alt="" draggable={false} loading="eager" decoding="async" {...{ fetchpriority: 'high' }}
          onLoad={handleImageLoad} onError={handleImageError} />
      </div>
      <div className="mobile-opening-welcome__wash" style={{ opacity: washOpacity }} />
    </div>
  );
}
