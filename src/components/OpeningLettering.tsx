import { type RefObject, useId, useLayoutEffect, useState } from 'react';
import '../styles/opening-lettering.css';

type OpeningLetteringProps = {
  sourceImage: string;
  timelineTime: number;
  visible: boolean;
  videoRef: RefObject<HTMLVideoElement>;
};

function fadeAfterHold(time: number, end: number) {
  const fraction = Math.max(0, Math.min(1, (time - 0.95) / (end - 0.95)));
  return 1 - fraction * fraction * (3 - 2 * fraction);
}

/** Restore only the original lettering artwork, never the moving people. */
export function OpeningLettering({ sourceImage, timelineTime, visible, videoRef }: OpeningLetteringProps) {
  const id = useId().replace(/:/g, '');
  const [guardOpacity, setGuardOpacity] = useState(1);
  const inOpening = visible && timelineTime < 1.5;

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!inOpening || !video) return;
    let frame = 0;
    const sample = () => {
      // Read the displayed media time: idle deliberately keeps UI time at zero.
      // Seeking remains exclusively owned by useScrollVideo.
      const fraction = Math.max(0, Math.min(1, (video.currentTime - 0.25) / 0.25));
      setGuardOpacity(1 - fraction * fraction * (3 - 2 * fraction));
    };
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
  }, [inOpening, videoRef]);

  if (!inOpening) return null;

  const titleOpacity = fadeAfterHold(timelineTime, 1.5);
  // The approaching teacher reaches the right badge after 1.2 seconds.
  const badgeOpacity = fadeAfterHold(timelineTime, 1.2);
  const titleRegions = [
    { name: 'heading', x: 456, y: 25, width: 383, height: 87, feather: 12 },
    { name: 'subtitle', x: 532, y: 121, width: 211, height: 43, feather: 12 },
  ];

  return (
    <section className="opening-lettering" aria-label="함께 연결되는 학교"
      data-title-opacity={titleOpacity.toFixed(3)} data-badge-opacity={badgeOpacity.toFixed(3)}
      data-guard-opacity={guardOpacity.toFixed(3)}>
      <svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id={`${id}-ink`} filterUnits="userSpaceOnUse" x="444" y="13" width="407" height="163" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -2.126 -7.152 -0.722 0 6.5" />
          </filter>
          {/* All glyphs are in opaque cores. Only the surrounding margins fade. */}
          {titleRegions.map(({ name, x, y, width, height, feather }) => (
            <g key={name}>
              <linearGradient id={`${id}-${name}-x`} gradientUnits="userSpaceOnUse" x1={x - feather} x2={x + width + feather}>
                <stop offset="0" stopColor="black" />
                <stop offset={feather / (width + 2 * feather)} stopColor="white" />
                <stop offset={1 - feather / (width + 2 * feather)} stopColor="white" />
                <stop offset="100%" stopColor="black" />
              </linearGradient>
              <linearGradient id={`${id}-${name}-y`} gradientUnits="userSpaceOnUse" x1="0" y1={y - feather} x2="0" y2={y + height + feather}>
                <stop offset="0" stopColor="black" />
                <stop offset={feather / (height + 2 * feather)} stopColor="white" />
                <stop offset={1 - feather / (height + 2 * feather)} stopColor="white" />
                <stop offset="100%" stopColor="black" />
              </linearGradient>
              <mask id={`${id}-${name}-vertical`} maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
                <rect x={x - feather} y={y - feather} width={width + 2 * feather} height={height + 2 * feather} fill={`url(#${id}-${name}-y)`} />
              </mask>
            </g>
          ))}
          <mask id={`${id}-title`} maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
            {titleRegions.map(({ name, x, y, width, height, feather }) => (
              <rect key={name} x={x - feather} y={y - feather} width={width + 2 * feather} height={height + 2 * feather}
                fill={`url(#${id}-${name}-x)`} mask={`url(#${id}-${name}-vertical)`} />
            ))}
          </mask>
          <radialGradient id={`${id}-badge`}>
            <stop offset="93.75%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <radialGradient id={`${id}-administration`}>
            <stop offset="93.548%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id={`${id}-badges`} maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
            <circle cx="325" cy="258" r="64" fill={`url(#${id}-badge)`} />
            <circle cx="633" cy="241" r="64" fill={`url(#${id}-badge)`} />
            <circle cx="1085" cy="242" r="62" fill={`url(#${id}-administration)`} />
          </mask>
        </defs>
        {/* Match the master's exact 16:9 frame and its centered cover crop. */}
        <g data-lettering-part="title" opacity={titleOpacity}>
          <image data-lettering-part="title-guard" href={sourceImage} width="1280" height="720" preserveAspectRatio="none"
            mask={`url(#${id}-title)`} opacity={guardOpacity} />
          <image data-lettering-part="title-ink" href={sourceImage} width="1280" height="720" preserveAspectRatio="none"
            filter={`url(#${id}-ink)`} mask={`url(#${id}-title)`} />
          <path d="M 487 113 C 526 96 548 115 588 111 S 641 94 683 99 S 733 115 773 109 Q 797 107 816 95"
            fill="none" stroke="#85adf9" strokeWidth="2.6" strokeLinecap="round" opacity={1 - guardOpacity} />
        </g>
        <image data-lettering-part="badges" href={sourceImage} width="1280" height="720" preserveAspectRatio="none"
          mask={`url(#${id}-badges)`} opacity={badgeOpacity} />
      </svg>
      <div className="sr-only">
        <h2>함께 연결되는 학교</h2>
        <p>AI가 만들어가는 더 밝은 오늘, 함께하는 더 큰 내일</p>
        <ul aria-hidden={badgeOpacity <= 0.05}>
          <li>학생지원</li><li>학교안전</li><li>학교행정</li>
        </ul>
      </div>
    </section>
  );
}
