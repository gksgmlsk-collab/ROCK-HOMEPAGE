import type { Scene } from './scenes';

/** Native portrait journey. Timings are independent of the PC master. */
export const MOBILE_CINEMATIC_DURATION = 51;
export const MOBILE_CINEMATIC_ENDING_START = 49;
export const MOBILE_CINEMATIC_MASTER = ['/generated/intro-mobile-v3/mobile-master.mp4'] as const;
export const MOBILE_CINEMATIC_LOGO = '/generated/intro-mobile-v3/posters/scene07.png';
export const MOBILE_CINEMATIC_OPENING_POSTER = '/generated/intro-mobile-v3/opening-poster.png';

// The reviewed clean opening gently blinks before the gate starts to open.
export const MOBILE_CINEMATIC_OPENING_IDLE_END = 0.2;

// The camera reaches the fantasy doorway before leg 01 finishes. Introduce
// Draconis at that arrival, rather than waiting for the 8-second clip seam.
export const MOBILE_CINEMATIC_DRACONIS_START = 3.5;

/** Plain-language context for the readable mobile scene caption. */
export const mobileCinematicCategories: Record<string, string> = {
  school: '돌 AI연구소 · 서비스 소개',
  draconis: '학생지원 · 맞춤형 학습',
  dolsoe: '학교행정 · AI 법령 검토',
  'public-data': '학교안전 · 도보 접근성 분석',
  'app-sharing': '학생지원 · 학생 앱 공유',
  'connected-school': '연구소 소개 · 함께 성장하는 학교',
  'dol-ai-lab-logo': '돌 AI연구소 · 홈페이지',
};

function mobileScene(
  id: string, order: number, title: string, subtitle: string,
  startTime: number, endTime: number, tone: Scene['tone'], alt: string,
): Scene {
  const image = `/generated/intro-mobile-v3/posters/scene${String(order).padStart(2, '0')}.png`;
  return {
    id, order, title, subtitle, startTime, endTime, tone, alt,
    sourceImage: image,
    mobileSourceImage: image,
    textStart: startTime,
    textEnd: endTime,
    textPosition: 'left-bottom',
    mobileTextPosition: 'left-bottom',
    focalPoint: { desktop: '50% 50%', mobile: '50% 50%' },
    posterFit: 'contain',
    accent: '#e3c37a',
    copyEmphasis: false,
    showCopy: false,
    preferMotion: true,
    enabled: true,
  };
}

export const mobileCinematicScenes: Scene[] = [
  mobileScene('school', 1, 'AI로 연결된 더 나은 학교', '학생지원 · 학교안전 · 학교행정', 0, MOBILE_CINEMATIC_DRACONIS_START, 'light',
    '학생지원, 학교안전, 학교행정이 금빛으로 연결된 학교에서 돌봇이 문을 열어 안내합니다.'),
  mobileScene('draconis', 2, '드라코니스', '미션을 풀고 드래곤을 키우며 수학·국어·영어를 배우는 학습 앱입니다.', MOBILE_CINEMATIC_DRACONIS_START, 16, 'dark',
    '학생들이 판타지 세계에서 배우고, 솟구치는 드래곤을 따라 돌쇠의 공간으로 이어집니다.'),
  mobileScene('dolsoe', 3, '돌쇠', '학교 사업계획서를 법령·조례·지침과 비교해 검토와 수정을 돕습니다.', 16, 23, 'dark',
    '학교 사업계획과 법령 검토를 돕는 돌쇠의 업무 화면을 금빛이 연결합니다.'),
  mobileScene('public-data', 4, '반경 너머', '학교 주변의 도보 경로와 야외활동 공간을 분석하는 도구입니다.', 23, 31, 'dark',
    '반경너머 지도 위 실제 길을 따라 반짝이는 빛이 학교들을 연결합니다.'),
  mobileScene('app-sharing', 5, '앱 나눔뜰', '학생이 직접 만든 앱을 올리고, 친구의 작품을 실행하고 공유하는 공간입니다.', 31, 41, 'light',
    '금빛이 코딩하는 학생들 사이를 지나 노트북 화면으로 모이고 다음 장면으로 이어집니다.'),
  mobileScene('connected-school', 6, '함께 행복한 학교', 'AI는 도구일 뿐, 교육의 중심은 언제나 사람입니다.', 41, 49, 'light',
    '학생과 선생님이 함께 웃는 학교에서 돌봇이 마지막 문을 열고 연구소 로고로 안내합니다.'),
  mobileScene('dol-ai-lab-logo', 7, '돌 AI연구소', 'AI for Education, Together.', 49, 51, 'light',
    '돌봇과 돌 AI연구소 DOL AI LAB 로고, 홈페이지 들어가기'),
];

export function mobileCinematicSceneAtTime(time: number): Scene {
  return mobileCinematicScenes.find((scene) => time < scene.endTime)
    ?? mobileCinematicScenes[mobileCinematicScenes.length - 1];
}
