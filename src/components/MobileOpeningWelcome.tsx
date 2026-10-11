import '../styles/mobile-opening-welcome.css';

type MobileOpeningWelcomeProps = {
  /** Presented timeline time; the opening idle deliberately remains at zero. */
  timelineTime: number;
  sourceImage: string;
};

function smoothstep(value: number) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

/** A whole original frame hands off under an opaque wash, never a body crossfade. */
export function MobileOpeningWelcome({ timelineTime, sourceImage }: MobileOpeningWelcomeProps) {
  const time = Number.isFinite(timelineTime) ? Math.max(0, timelineTime) : 0;
  if (time >= .5) return null;

  const showOriginal = time < .25;
  // Hold the fully opaque peak across several 30fps frames so the artwork
  // switch is concealed in both scroll directions, including coarse seeks.
  const washOpacity = time < .2
    ? smoothstep((time - .1) / .1)
    : time <= .3 ? 1 : 1 - smoothstep((time - .3) / .15);

  return (
    <div className="mobile-opening-welcome" aria-hidden="true"
      data-timeline-time={time.toFixed(3)}
      data-original-visible={showOriginal ? 'true' : 'false'}
      data-wash-opacity={washOpacity.toFixed(3)}>
      <div className="mobile-opening-welcome__original"
        style={{ visibility: showOriginal ? 'visible' : 'hidden' }}>
        <img src={sourceImage} alt="" draggable={false} loading="eager" decoding="sync" />
      </div>
      <div className="mobile-opening-welcome__wash" style={{ opacity: washOpacity }} />
    </div>
  );
}
