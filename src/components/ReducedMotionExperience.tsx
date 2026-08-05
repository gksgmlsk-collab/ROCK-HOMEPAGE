import { ending, scenes } from '../data/scenes';
import { EndBrand } from './EndSequence';
import { MotionPreferenceControl } from './MotionPreferenceControl';

type ReducedMotionExperienceProps = {
  onEnableAnimation?: () => void;
};

export function ReducedMotionExperience({
  onEnableAnimation,
}: ReducedMotionExperienceProps) {
  return (
    <div className="reduced-world" id="journey-start">
      <h1 className="sr-only">돌 AI연구소 DOL AI LAB 공식 소개</h1>
      <p className="sr-only">
        움직임 줄이기 설정 또는 사용자의 선택에 따라 영상 대신 다섯 개의 정적
        장면을 순서대로 제공합니다.
      </p>
      {onEnableAnimation && (
        <MotionPreferenceControl
          mode="static"
          onChange={onEnableAnimation}
        />
      )}
      {scenes
        .filter((scene) => scene.enabled)
        .map((scene, index) => (
          <section
            className={`reduced-scene reduced-scene--${scene.tone}`}
            key={scene.id}
          >
            <picture>
              <source
                media="(orientation: portrait) and (max-width: 1024px)"
                srcSet={scene.mobileSourceImage}
              />
              <img
                src={scene.sourceImage}
                alt={scene.alt}
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            </picture>
            {scene.showCopy && (
              <div className="reduced-scene__copy">
                <h2>{scene.title}</h2>
                <p>{scene.subtitle}</p>
              </div>
            )}
          </section>
        ))}
      <section className="reduced-ending">
        <p>{ending.messages[0]}</p>
      </section>
      <section className="reduced-ending">
        <p>{ending.messages[1]}</p>
      </section>
      <section className="reduced-ending reduced-ending--logo">
        <EndBrand />
      </section>
    </div>
  );
}
