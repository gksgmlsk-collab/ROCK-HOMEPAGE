import type { Scene } from '../data/scenes';

type PosterStackProps = {
  scenes: Scene[];
  activeId: string;
  isMobile: boolean;
  usePortraitSource: boolean;
};

export function PosterStack({
  scenes,
  activeId,
  isMobile,
  usePortraitSource,
}: PosterStackProps) {
  return (
    <div className="poster-stack">
      {scenes.map((scene, index) => {
        const isActive = scene.id === activeId;
        const sourceImage = usePortraitSource
          ? scene.mobileSourceImage
          : scene.sourceImage;
        const preserveFullArtwork = isMobile || usePortraitSource;

        return (
          <figure
            className={`poster-layer${isActive ? ' is-active' : ''}`}
            data-fit={preserveFullArtwork ? 'contain' : scene.posterFit}
            key={scene.id}
            aria-hidden={!isActive}
          >
            <img
              className="poster-layer__backdrop"
              src={sourceImage}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <img
              className="poster-layer__image"
              src={sourceImage}
              alt={isActive ? scene.alt : ''}
              loading={index === 0 ? 'eager' : 'lazy'}
              style={{
                objectPosition: preserveFullArtwork
                  ? '50% 50%'
                  : scene.focalPoint.desktop,
              }}
            />
          </figure>
        );
      })}
    </div>
  );
}
