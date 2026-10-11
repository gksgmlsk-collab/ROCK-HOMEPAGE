import { type RefObject, useId, useLayoutEffect, useState } from 'react';
import '../styles/mobile-opening-lettering.css';

type MobileOpeningLetteringProps = {
  sourceImage: string;
  timelineTime: number;
  visible: boolean;
  videoRef: RefObject<HTMLVideoElement>;
};

// Coordinates were checked against the 720 × 1280 source frames. The opening
// uses raw frames 30..191 (1.25..8 seconds), retimed to exactly eight seconds.
type TrackPoint = readonly [time: number, x: number, y: number, scale: number, opacity: number];

const titleTrack: readonly TrackPoint[] = [
  [1.25, 200, 185, 1, 1], [1.75, 200, 183, 1, 1],
  [2, 199, 179, 1.006, 1], [2.125, 199, 176, 1.012, 1],
  [2.25, 198, 173, 1.016, 1], [2.375, 198, 169, 1.02, 1],
  [2.5, 198, 166, 1.022, 1], [2.7, 198, 164, 1.025, 0],
];

const badgeTracks = [
  {
    name: 'student', label: '학생지원', source: [439, 248] as const,
    points: [
      [1.25, 439, 248, 1, 1], [1.75, 440, 246, 1, 1],
      [2, 441, 241, 1.025, 1], [2.125, 444, 234, 1.04, 1],
      [2.25, 448, 226, 1.06, 1], [2.375, 449, 219, 1.08, 1],
      [2.5, 450, 211, 1.1, 1], [2.75, 450, 204, 1.13, 0],
    ] as readonly TrackPoint[],
  },
  {
    name: 'safety', label: '학교안전', source: [219, 626] as const,
    points: [
      [1.25, 219, 626, 1, 1], [1.75, 220, 625, 1, 1],
      [2, 220, 625, 1.02, 1], [2.125, 219, 626, 1.025, 1],
      [2.25, 216, 625, 1.025, 1], [2.375, 212, 625, 1.025, 1],
      [2.5, 209, 625, 1.025, 1], [2.75, 203, 624, 1.035, 0],
    ] as readonly TrackPoint[],
  },
  {
    name: 'administration', label: '학교행정', source: [153, 948] as const,
    points: [
      [1.25, 153, 948, 1, 1], [1.5, 152, 948, 1, 1],
      [1.75, 151, 949, 1.015, 1], [2, 148, 960, 1.07, 1],
      [2.125, 147, 967, 1.1, 1], [2.25, 140, 982, 1.15, 1],
      [2.375, 134, 993, 1.18, 1], [2.5, 123, 1016, 1.25, 1],
      [2.625, 104, 1043, 1.35, 1], [2.75, 72, 1085, 1.48, 1],
      [2.875, 47, 1119, 1.61, 1], [3, -8, 1180, 1.81, 1],
      [3.125, -78, 1254, 2.05, 1], [3.25, -181, 1350, 2.35, 1],
    ] as readonly TrackPoint[],
  },
] as const;

function sampleTrack(points: readonly TrackPoint[], time: number): TrackPoint {
  if (time <= points[0][0]) return points[0];
  const last = points[points.length - 1];
  if (time >= last[0]) return last;
  const end = points.findIndex((point) => point[0] >= time);
  const from = points[end - 1];
  const to = points[end];
  const progress = (time - from[0]) / (to[0] - from[0]);
  const lerp = (index: 1 | 2 | 3 | 4) => from[index] + (to[index] - from[index]) * progress;
  return [time, lerp(1), lerp(2), lerp(3), lerp(4)];
}

/** Original lettering follows the opening artwork; no face or body is patched. */
export function MobileOpeningLettering({ sourceImage, timelineTime, visible, videoRef }: MobileOpeningLetteringProps) {
  const id = useId().replace(/:/g, '');
  const [mediaTime, setMediaTime] = useState(0);
  const nearOpening = visible && timelineTime < 3;

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!nearOpening || !video) return;
    let frame = 0;
    const sample = () => setMediaTime((previous) => Math.abs(previous - video.currentTime) < .001 ? previous : video.currentTime);
    const tick = () => {
      if (!document.hidden) sample();
      frame = requestAnimationFrame(tick);
    };
    sample();
    video.addEventListener('seeked', sample);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener('seeked', sample);
    };
  }, [nearOpening, videoRef]);

  const rawTime = 1.25 + mediaTime * 6.75 / 8;
  if (!nearOpening || rawTime >= 3.25) return null;
  const [, titleX, titleY, titleScale, titleOpacity] = sampleTrack(titleTrack, rawTime);

  return (
    <section className="mobile-opening-lettering" aria-label="AI로 연결된 더 나은 학교"
      data-media-time={mediaTime.toFixed(3)} data-lettering-raw-time={rawTime.toFixed(3)}
      data-title-opacity={titleOpacity.toFixed(3)}>
      <svg viewBox="0 0 720 1280" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-badge-edge`}>
            <stop offset="93.75%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          {badgeTracks.map(({ name, source: [x, y] }) => (
            <mask key={name} id={`${id}-${name}`} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="1280">
              <circle cx={x} cy={y} r="65" fill={`url(#${id}-badge-edge)`} />
            </mask>
          ))}
          <filter id={`${id}-title-ink-guard`} filterUnits="userSpaceOnUse" x="30" y="80" width="340" height="215" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2.126 -7.152 -0.722 0 6.5" result="dark-ink" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -3 -3 6 0 -0.15" result="blue-ink" />
            <feComposite in="blue-ink" in2="dark-ink" operator="in" />
            <feMorphology operator="dilate" radius="4" />
            <feGaussianBlur stdDeviation="1" />
          </filter>
          <clipPath id={`${id}-title-region`}><rect x="40" y="95" width="315" height="190" /></clipPath>
          <mask id={`${id}-title`} maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="1280">
            <g clipPath={`url(#${id}-title-region)`}>
              <image href={sourceImage} width="720" height="1280" preserveAspectRatio="none" filter={`url(#${id}-title-ink-guard)`} />
            </g>
          </mask>
        </defs>
        <g data-lettering-part="title" opacity={titleOpacity}
          transform={`translate(${titleX} ${titleY}) scale(${titleScale}) translate(-200 -185)`}>
          <image href={sourceImage} width="720" height="1280" preserveAspectRatio="none" mask={`url(#${id}-title)`} />
        </g>
        {badgeTracks.map(({ name, label, source: [sourceX, sourceY], points }) => {
          const [, x, y, scale, opacity] = sampleTrack(points, rawTime);
          return (
            <g key={name} data-lettering-part={name} data-label={label} data-badge-opacity={opacity.toFixed(3)} opacity={opacity}
              transform={`translate(${x} ${y}) scale(${scale}) translate(${-sourceX} ${-sourceY})`}>
              <image href={sourceImage} width="720" height="1280" preserveAspectRatio="none" mask={`url(#${id}-${name})`} />
            </g>
          );
        })}
      </svg>
      <div className="sr-only"><h2>AI로 연결된 더 나은 학교</h2><p>학생지원 · 학교안전 · 학교행정</p></div>
    </section>
  );
}
