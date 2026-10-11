import '../styles/cinematic-award-badge.css';

const sceneAwards: Record<string, { image: string; label: string }> = {
  dolsoe: {
    image: '/assets/awards/legislation-minister.png',
    label: '돌쇠 · 법제처장상',
  },
  'public-data': {
    image: '/assets/awards/education-minister.png',
    label: '반경 너머 · 교육부장관상',
  },
};

/** A crisp original badge follows the active scene, including reverse scroll. */
export function CinematicAwardBadge({ sceneId }: { sceneId: string }) {
  const award = sceneAwards[sceneId];
  if (!award) return null;

  return (
    <img className="cinematic-award-badge" src={award.image} alt={award.label}
      data-award-scene={sceneId} width={1254} height={1254} decoding="async" />
  );
}
