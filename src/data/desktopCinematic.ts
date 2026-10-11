import { type Scene, scenes as originalScenes } from './scenes';

/** PC-only editorial map. The original 44-second phone journey is independent. */
export const DESKTOP_CINEMATIC_DURATION = 54;
export const DESKTOP_CINEMATIC_ENDING_START = 52;
export const DESKTOP_CINEMATIC_MASTER = ['/generated/intro-v3/desktop-master.mp4'] as const;
export const DESKTOP_CINEMATIC_LOGO = '/generated/intro-v3/posters/scene07.png';

const sourceScene = (id: string) => originalScenes.find((scene) => scene.id === id)!;

function cinematicScene(
  source: Scene,
  order: number,
  startTime: number,
  endTime: number,
  overrides: Partial<Scene> = {},
): Scene {
  const image = overrides.sourceImage ?? source.sourceImage;
  return {
    ...source,
    order, startTime, endTime,
    textStart: startTime + 0.65,
    textEnd: endTime - 0.8,
    mobileSourceImage: image,
    posterFit: 'contain',
    preferMotion: true,
    showCopy: true,
    copyEmphasis: true,
    ...overrides,
  };
}

export const desktopCinematicScenes: Scene[] = [
  cinematicScene(sourceScene('dol-ai-lab'), 1, 0, 8, {
    title: '함께 연결되는 학교',
    subtitle: 'AI가 만들어가는 더 밝은 오늘,\n함께하는 더 큰 내일',
    sourceImage: '/generated/intro-v3/posters/scene01.png',
    textStart: 0.6,
    textEnd: 3.8,
    alt: '학생, 선생님과 돌봇이 금빛 길로 연결된 따뜻한 학교. 학생지원, 학교안전, 학교행정',
  }),
  cinematicScene(sourceScene('draconis'), 2, 8, 13),
  cinematicScene(sourceScene('public-data'), 3, 17, 22),
  cinematicScene(sourceScene('dolsoe'), 4, 26, 31),
  cinematicScene(sourceScene('connected-school'), 5, 35, 41, {
    id: 'app-sharing',
    title: '앱 나눔뜰',
    subtitle: '학생들이 직접 만들고 함께 나누는 앱 놀이터',
    sourceImage: '/generated/intro-v3/posters/scene05.png',
    // Clear the caption before the camera reaches the student's typing hands.
    textEnd: 37.5,
    accent: '#aa91f1',
    alt: '직접 만든 앱을 친구들과 나누는 학생들과 돌봇의 앱 나눔뜰',
  }),
  cinematicScene(sourceScene('connected-school'), 6, 45, 52, {
    title: '함께 행복한 학교',
    subtitle: 'AI는 도구일 뿐,\n교육의 중심은 언제나 사람입니다.',
    sourceImage: '/generated/intro-v3/posters/scene06.png',
    textStart: 45.6,
    textEnd: 49,
    alt: '학생과 선생님이 돌봇과 함께 웃는 DOL AI LAB 학교 공동체',
  }),
];

export function desktopCinematicSceneAtTime(time: number): Scene {
  for (let index = 0; index < desktopCinematicScenes.length; index += 1) {
    const scene = desktopCinematicScenes[index];
    const next = desktopCinematicScenes[index + 1];
    if (!next || time <= scene.endTime) return scene;
    if (time < next.startTime) {
      const midpoint = scene.endTime + (next.startTime - scene.endTime) / 2;
      return time < midpoint ? scene : next;
    }
  }
  return desktopCinematicScenes[desktopCinematicScenes.length - 1];
}
