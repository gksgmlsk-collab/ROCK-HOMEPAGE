import type { CSSProperties } from 'react';
import type { Scene } from '../data/scenes';

type ProgressIndicatorProps = {
  scenes: Scene[];
  activeId: string;
  progress: number;
  onSelect: (scene: Scene) => void;
};

export function ProgressIndicator({
  scenes,
  activeId,
  progress,
  onSelect,
}: ProgressIndicatorProps) {
  const activeScene = scenes.find((scene) => scene.id === activeId) ?? scenes[0];

  return (
    <nav
      className="journey-progress"
      aria-label="돌 AI연구소 여정"
      style={{ '--journey-progress': progress } as CSSProperties}
    >
      <div className="journey-progress__line" aria-hidden="true">
        <span />
      </div>
      <ol>
        {scenes.map((scene) => (
          <li key={scene.id}>
            <button
              type="button"
              className={scene.id === activeId ? 'is-active' : ''}
              aria-current={scene.id === activeId ? 'step' : undefined}
              aria-label={`${scene.order}번째 장면, ${scene.title}로 이동`}
              onClick={() => onSelect(scene)}
            >
              <span aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <p aria-live="polite">
        <span>{String(activeScene.order).padStart(2, '0')}</span>
        {activeScene.title}
      </p>
    </nav>
  );
}
