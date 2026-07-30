import type { CSSProperties } from 'react';
import type { Scene } from '../data/scenes';

type SceneOverlayProps = {
  scene: Scene;
  timelineTime: number;
};

const smoothstep = (value: number) => {
  const normalized = Math.min(1, Math.max(0, value));
  return normalized * normalized * (3 - 2 * normalized);
};

export function SceneOverlay({ scene, timelineTime }: SceneOverlayProps) {
  if (!scene.showCopy) return null;

  const fadeDuration = 0.55;
  const fadeIn = smoothstep((timelineTime - scene.textStart) / fadeDuration);
  const fadeOut = smoothstep((scene.textEnd - timelineTime) / fadeDuration);
  const opacity = Math.min(fadeIn, fadeOut);
  const isReadable = opacity > 0.05;

  return (
    <section
      className={[
        'scene-copy',
        `scene-copy--${scene.tone}`,
        scene.copyEmphasis ? 'scene-copy--emphasis' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-position={scene.textPosition}
      data-mobile-position={scene.mobileTextPosition}
      style={
        {
          '--scene-copy-opacity': opacity,
          '--scene-copy-accent': scene.accent,
        } as CSSProperties
      }
      aria-hidden={!isReadable}
    >
      <h2>{scene.title}</h2>
      <p>{scene.subtitle}</p>
    </section>
  );
}
