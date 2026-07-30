export type TextPosition =
  | 'left-top'
  | 'left-bottom'
  | 'right-top'
  | 'right-bottom';

export type FocalPoint = {
  desktop: string;
  mobile: string;
};

export type Scene = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  sourceImage: string;
  mobileSourceImage: string;
  startTime: number;
  endTime: number;
  textStart: number;
  textEnd: number;
  textPosition: TextPosition;
  mobileTextPosition: TextPosition;
  focalPoint: FocalPoint;
  posterFit: 'cover' | 'contain';
  tone: 'light' | 'dark';
  accent: string;
  copyEmphasis: boolean;
  showCopy: boolean;
  preferMotion: boolean;
  enabled: boolean;
  alt: string;
};

/**
 * The values below describe the editorial master timeline in seconds:
 * five 5-second scenes, four 4-second bridges, and a 3-second ending.
 * useScrollVideo scales this 44-second map to the real media duration after
 * loadedmetadata, so replacing the master with a slightly different encode does
 * not break scroll sync or copy timing.
 */
export const TIMELINE_DURATION = 44;
export const ENDING_START = 41;
export const INTRO_LOOP_VIDEO =
  '/generated/hero/dol-ai-lab-living-loop.mp4';

export const MASTER_VIDEO = {
  desktop: ['/generated/master/dol-ai-lab-scroll.mp4'],
  mobile: [
    '/generated/master/dol-ai-lab-scroll.mp4',
  ],
} as const;

export const scenes: Scene[] = [
  {
    id: 'dol-ai-lab',
    order: 1,
    title: 'DOL AI LAB',
    subtitle: '학생과 선생님이 함께 행복한 학교를 위한 연구소',
    sourceImage: '/assets/scene1_dol_ai_lab.png',
    mobileSourceImage:
      '/generated/frames/mobile/canvases/scene01_dol_ai_lab_canvas.png',
    startTime: 0,
    endTime: 5,
    textStart: 0.72,
    textEnd: 4.2,
    textPosition: 'left-bottom',
    mobileTextPosition: 'left-bottom',
    focalPoint: { desktop: '50% 48%', mobile: '49% 48%' },
    posterFit: 'cover',
    tone: 'dark',
    accent: '#d6ad52',
    copyEmphasis: true,
    showCopy: true,
    preferMotion: true,
    enabled: true,
    alt: '교사와 학생, 돌봇이 함께 있는 따뜻한 교실과 DOL AI LAB 연구소 소개',
  },
  {
    id: 'draconis',
    order: 2,
    title: '드라코니스',
    subtitle: '배움이 모험이 되는 순간',
    sourceImage: '/assets/scene2_draconis.png',
    mobileSourceImage:
      '/generated/frames/mobile/canvases/scene02_draconis_canvas.png',
    startTime: 9,
    endTime: 14,
    textStart: 9.72,
    textEnd: 13.2,
    textPosition: 'left-bottom',
    mobileTextPosition: 'left-bottom',
    focalPoint: { desktop: '53% 49%', mobile: '53% 54%' },
    posterFit: 'cover',
    tone: 'light',
    accent: '#e6b74e',
    copyEmphasis: true,
    showCopy: true,
    preferMotion: false,
    enabled: true,
    alt: '학생 두 명과 돌봇이 판타지 학습 세계에서 함께 공부하는 드라코니스 장면',
  },
  {
    id: 'public-data',
    order: 3,
    title: '학생은 반경으로\n걷지 않는다',
    subtitle: '실제 도보 흐름으로\n학교 문제를 읽다.',
    sourceImage: '/assets/scene3_data_map.png',
    mobileSourceImage:
      '/generated/frames/mobile/canvases/scene03_data_map_canvas.png',
    startTime: 18,
    endTime: 23,
    textStart: 18.72,
    textEnd: 22.2,
    textPosition: 'left-bottom',
    mobileTextPosition: 'left-bottom',
    focalPoint: { desktop: '63% 52%', mobile: '63% 50%' },
    posterFit: 'cover',
    tone: 'light',
    accent: '#68c79b',
    copyEmphasis: true,
    showCopy: true,
    preferMotion: false,
    enabled: true,
    alt: '실제 도보 흐름과 학교 접근성을 분석하는 인천 교육 공공데이터 지도',
  },
  {
    id: 'dolsoe',
    order: 4,
    title: '돌쇠',
    subtitle: '현장 문제를 실제 서비스로',
    sourceImage: '/assets/scene4_awards_dolsoe.png',
    mobileSourceImage:
      '/generated/frames/mobile/canvases/scene04_dolsoe_canvas.png',
    startTime: 27,
    endTime: 32,
    textStart: 27.72,
    textEnd: 31.2,
    textPosition: 'left-bottom',
    mobileTextPosition: 'left-bottom',
    focalPoint: { desktop: '55% 50%', mobile: '60% 49%' },
    posterFit: 'cover',
    tone: 'light',
    accent: '#62b6e9',
    copyEmphasis: true,
    showCopy: true,
    preferMotion: false,
    enabled: true,
    alt: '사업계획과 법령 검토를 돕는 돌쇠 AI 서비스와 검은 휴머노이드',
  },
  {
    id: 'connected-school',
    order: 5,
    title: 'AI가 연결하는 더 나은 학교',
    subtitle: '교사는 가볍게, 가정은 안심하게, 학교는 안전하게',
    sourceImage: '/assets/scene5_services.png',
    mobileSourceImage:
      '/generated/frames/mobile/canvases/scene05_services_canvas.png',
    startTime: 36,
    endTime: 41,
    textStart: 36.65,
    textEnd: 40.35,
    textPosition: 'right-bottom',
    mobileTextPosition: 'left-bottom',
    focalPoint: { desktop: '50% 50%', mobile: '50% 47%' },
    posterFit: 'contain',
    tone: 'dark',
    accent: '#d6ad52',
    copyEmphasis: false,
    showCopy: false,
    preferMotion: true,
    enabled: true,
    alt: '교사 업무, 안심 급식, 방문증 서비스를 통해 연결되는 학교 공동체',
  },
];

export const ending = {
  startTime: ENDING_START,
  firstMessageEnd: 42,
  secondMessageEnd: 43,
  endTime: TIMELINE_DURATION,
  messages: ['학교를 더 똑똑하게', '교사의 시간을 학생에게'],
};

export function sceneAtTime(time: number): Scene {
  const enabledScenes = scenes.filter((scene) => scene.enabled);

  for (let index = 0; index < enabledScenes.length; index += 1) {
    const scene = enabledScenes[index];
    const next = enabledScenes[index + 1];

    if (!next || time <= scene.endTime) {
      return scene;
    }

    if (time < next.startTime) {
      const transitionMidpoint = scene.endTime + (next.startTime - scene.endTime) / 2;
      return time < transitionMidpoint ? scene : next;
    }
  }

  return enabledScenes[enabledScenes.length - 1];
}
