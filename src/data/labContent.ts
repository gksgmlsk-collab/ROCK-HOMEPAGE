export type NavItem = {
  label:
    | '연구소 소개'
    | '대표 서비스'
    | '연구소 수상'
    | '서비스 포트폴리오'
    | '운영조직';
  href:
    | '#lab-intro'
    | '#lab-featured'
    | '#lab-awards'
    | '#lab-services'
    | '#lab-organization';
};

export type OrganizationGroup = {
  role: string;
  names: string[];
};

export type Department = {
  title: string;
  lead: string;
  body: string;
};

export type FeaturedService = {
  id: string;
  name: string;
  category: string;
  summary: string;
  image: string;
  imageAlt: string;
  imageFit: 'cover' | 'contain';
  url: string;
  actionLabel: string;
};

export type Award = {
  id: string;
  eyebrow: string;
  award: string;
  title: string;
  team: string;
  recognition?: string;
  summary: string;
  image: string;
  imageAlt: string;
  stats: Array<{ value: string; label: string }>;
  reportUrl: string;
  serviceUrl: string;
};

export const projectCategories = [
  '전체',
  '학습앱',
  '행정앱',
  '홍보·운영',
  '개인 실험',
] as const;

export type ProjectCategory = (typeof projectCategories)[number];
export type ProjectFilter = Exclude<ProjectCategory, '전체'>;

export type Project = {
  id: string;
  name: string;
  category: ProjectFilter;
  stage: string;
  owner: string;
  ownerNote?: string;
  summary: string;
  url: string | null;
  actionLabel: string;
};

export const primaryNavigation: NavItem[] = [
  { label: '연구소 소개', href: '#lab-intro' },
  { label: '대표 서비스', href: '#lab-featured' },
  { label: '연구소 수상', href: '#lab-awards' },
  { label: '서비스 포트폴리오', href: '#lab-services' },
  { label: '운영조직', href: '#lab-organization' },
];

export const labIntro = {
  label: 'SCHOOL-BASED AI INNOVATION LAB',
  title: '학교의 문제를, AI로 해결합니다.',
  body: [
    '석암초 돌AI연구소는 학교 현장에서 발견한 실제 문제를 교직원이 직접 정의하고, AI와 디지털 기술을 활용해 해결책을 설계·구현·적용하는 학교 기반 연구 조직입니다.',
    '완성된 결과물만 전시하는 데 그치지 않고, 아이디어를 데모로 만들고 학교 현장에 적용한 뒤 사용자 의견을 반영하여 지속적으로 개선합니다.',
  ],
  principles: [
    {
      title: '현장 문제에서 출발',
      body: '교사와 학생이 실제로 겪는 불편과 교육적 요구를 해결 과제로 설정합니다.',
    },
    {
      title: '교직원이 직접 설계',
      body: '교육과 행정에 대한 현장 전문성을 바탕으로 필요한 기능과 콘텐츠를 구체화합니다.',
    },
    {
      title: '빠르게 구현하고 검증',
      body: 'AI 코딩 도구와 웹 기술을 활용해 데모를 제작하고 실제 사용자와 검증합니다.',
    },
    {
      title: '적용 후 지속 개선',
      body: '학교 적용을 끝이 아니라 새로운 개선 주기의 시작으로 봅니다.',
    },
  ],
};

export const organization = {
  groups: [
    { role: '연구소장', names: ['조미진'] },
    {
      role: '부서별 팀장',
      names: ['이창성', '이남건', '한희나', '김종섭'],
    },
    {
      role: '연구원',
      names: ['허수영', '박주현', '김한일', '김민재', '홍승유', '한은서'],
    },
    {
      role: '운영지원',
      names: ['박동훈', '황차호', '윤효진', '서은영'],
    },
  ] satisfies OrganizationGroup[],
  departments: [
    {
      title: '행정 운영',
      lead: '이창성',
      body: '연구소 운영에 필요한 행정 업무를 체계화하고, 예산·성과를 정리해 공유합니다.',
    },
    {
      title: 'AI 개발',
      lead: '이남건',
      body: '반복되는 학교 업무를 줄이고 행정 효율을 높이는 서비스를 개발합니다.',
    },
    {
      title: '홍보',
      lead: '한희나',
      body: '연구소의 프로젝트, 사용 사례와 성과를 기록하고 공유합니다.',
    },
    {
      title: 'AI 동아리',
      lead: '김종섭',
      body: '교사·학생 동아리의 기획·운영을 지원하고 활동 성과를 축적합니다.',
    },
  ] satisfies Department[],
};

export const featuredServices: FeaturedService[] = [
  {
    id: 'draconis',
    name: '드라코니스',
    category: '개인 맞춤 교수·학습',
    summary:
      '드라코니스는 2022 개정 교육과정의 수학·국어·영어 학습을 게임형 모험으로 구성한 개인 맞춤 교수·학습 지원 시스템입니다. 학생은 미션을 해결하고 드래곤을 성장시키며 CLA 단계별 풀이(문제 파악 → 계산 과정 → 최종 확인)를 익히고, 어휘·독해·영어 기초 학습과 운동 활동을 한곳에서 이어갑니다. 교사는 학급·학생별 참여 현황, 개념별 성취도와 오개념, 풀이 경로를 확인해 보충 학습과 맞춤형 지도를 제공할 수 있습니다.',
    image: '/assets/lab/draconis-learning-home.png',
    imageAlt: '드라코니스 학습 모험 홈 화면',
    imageFit: 'contain',
    url: 'https://draconis.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'dolsoe',
    name: '돌쇠',
    category: 'AI 법령 검토',
    summary:
      '학교 사업계획서를 업로드하면 관련 법령을 자동으로 찾아 준수 여부와 누락 사항을 검토하고, 근거 법령과 수정 권고를 제공하는 AI 기반 법령 검토 시스템입니다. AI는 검토를 지원하고 최종 판단은 사람이 수행합니다.',
    image: '/assets/lab/dolsoe-review.png',
    imageAlt: 'AI 학교 사업계획 법령 검토 비서 돌쇠 화면',
    imageFit: 'cover',
    url: 'https://schoollaw-review-production.up.railway.app/web/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'seokam-on',
    name: '석암 ON',
    category: '학교 통합 운영',
    summary:
      '분산된 학교 행정과 운영 기능을 한곳에서 확인하고 처리하도록 지원하는 학교 맞춤형 통합 서비스입니다.',
    image: '/assets/lab/seokam-on.png',
    imageAlt: '석암 ON 학교 통합 운영 서비스 화면',
    imageFit: 'cover',
    url: 'https://disciplined-happiness-production-ad86.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'dolflix',
    name: '돌FLIX',
    category: '교육 콘텐츠',
    summary:
      '명상 및 영상 자료를 한곳에서 공유하고 활용하기 위한 콘텐츠 페이지입니다.',
    image: '/assets/lab/dolflix-cover.png',
    imageAlt: '명상과 교육 영상을 모은 돌FLIX 화면',
    imageFit: 'cover',
    url: 'https://school-meditation-production.up.railway.app/',
    actionLabel: '데모 체험',
  },
];

export const awards: Award[] = [
  {
    id: 'data-rock',
    eyebrow: '제8회 교육 공공데이터 AI 활용대회',
    award: '일반부 대상 · 교육부장관상',
    title: '반경 너머,\n도달 가능성으로',
    team: 'DATA ROCK · 조미진 · 한희나 · 박동훈',
    recognition:
      '범정부 공공데이터 AI활용 창업경진대회 교육부 추천 출품작(단독 1팀)',
    summary:
      '지도상의 반경이 아닌 아이의 실제 도보 흐름으로 학교 주변 녹지 접근성을 진단하고, 우선 지원이 필요한 학교를 데이터로 제시했습니다.',
    image: '/assets/lab/bangyeong-research/report-page-01.png',
    imageAlt: '반경 너머, 도달 가능성으로 연구보고서 표지',
    stats: [
      { value: '242교', label: '분석 대상 초등학교' },
      { value: '20종', label: '공공·행정·공간 데이터' },
      { value: '67.4%', label: '도보권 녹지 5% 미만' },
    ],
    reportUrl: 'https://lab-tq11.onrender.com/bangyeong.html',
    serviceUrl: 'https://park-analysis-web-production.up.railway.app/',
  },
  {
    id: 'dolsoe-award',
    eyebrow: '제2회 법령데이터 활용 아이디어 공모전',
    award: '제품·서비스 개발 부문 전국 최우수상 · 법제처장상',
    title: 'AI 학교 사업 계획\n법령 검토 비서,\n돌쇠',
    team: '개발 · 박동훈',
    summary:
      '학교 사업계획과 최신 법령을 연결해 준수·누락·위반 가능성과 수정 권고를 제시합니다. 전국 본선 6개 팀 가운데 1위로 선정됐습니다.',
    image: '/assets/lab/dolsoe-research/dolsoe-page-01.png',
    imageAlt: 'AI 학교 사업계획 법령 검토 비서 돌쇠 소개서 표지',
    stats: [
      { value: '약 400개', label: '초등학교 관련 법령' },
      { value: '10개', label: '검토 분야' },
      { value: '6 → 1위', label: '전국 본선 결과' },
    ],
    reportUrl: 'https://lab-tq11.onrender.com/dolsoe.html',
    serviceUrl: 'https://schoollaw-review-production.up.railway.app/web/',
  },
];

export const projects: Project[] = [
  {
    id: 'draconis',
    name: '드라코니스',
    category: '학습앱',
    stage: '학교 적용+지속 개선',
    owner: '조미진',
    ownerNote: '영어콘텐츠 제공 박주현',
    summary:
      '학생은 드래곤을 성장시키며 학습하고, 교사는 학생별 오개념과 학습 경로를 파악하는 게임형 개인 맞춤 교수·학습 지원 시스템입니다.',
    url: 'https://draconis.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'dolsoe',
    name: '돌쇠',
    category: '행정앱',
    stage: '학교 적용+교육청 확산',
    owner: '박동훈',
    summary:
      '학교 사업계획서를 업로드하면 관련 법령을 찾아 준수 여부와 누락 사항을 검토하고, 근거 법령과 수정 권고를 제공하는 AI 기반 법령 검토 시스템입니다.',
    url: 'https://schoollaw-review-production.up.railway.app/web/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'seokam-on',
    name: '석암 ON',
    category: '행정앱',
    stage: '학교 적용+지속 개선',
    owner: '이남건',
    summary:
      '분산된 학교 행정과 운영 기능을 한곳에서 확인하고 처리하도록 지원하는 통합 서비스입니다.',
    url: 'https://disciplined-happiness-production-ad86.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'food-allergy',
    name: '석암 안심급식',
    category: '행정앱',
    stage: '학교 적용+지속 개선',
    owner: '한희나',
    summary:
      '급식과 알레르기 정보를 사용자가 쉽게 확인하도록 지원하는 안내 서비스입니다.',
    url: 'https://food-allergy-production.up.railway.app/#/setup',
    actionLabel: '서비스 체험',
  },
  {
    id: 'visitor-pass',
    name: '일일방문증',
    category: '행정앱',
    stage: '학교 적용+지속 개선',
    owner: '김한일',
    summary:
      '학교 방문자의 신청과 일일 방문 절차를 체계적으로 지원하는 서비스입니다.',
    url: 'https://visitor-pass-production.up.railway.app/visitor-pass',
    actionLabel: '서비스 체험',
  },
  {
    id: 'press-release',
    name: '보도자료앱',
    category: '행정앱',
    stage: '학교 적용+지속 개선',
    owner: '연구원',
    summary:
      '학교 활동을 보도자료 형식으로 작성하고 관리하도록 지원하는 서비스입니다.',
    url: 'https://ai-html-production.up.railway.app/ai.html',
    actionLabel: '서비스 체험',
  },
  {
    id: 'umbrella',
    name: '아차우산',
    category: '행정앱',
    stage: '내부테스트',
    owner: '이창성',
    summary: '학교의 우산 관련 운영을 지원하기 위한 생활 밀착형 서비스입니다.',
    url: null,
    actionLabel: '상세 공개 예정',
  },
  {
    id: 'dolflix',
    name: '돌FLIX',
    category: '학습앱',
    stage: '데모',
    owner: '김한일',
    summary:
      '명상 및 영상 자료를 한곳에서 공유하고 활용하기 위한 콘텐츠 페이지입니다.',
    url: 'https://school-meditation-production.up.railway.app/',
    actionLabel: '데모 체험',
  },
  {
    id: 'michuhol-city-development',
    name: '미추홀구 도시개발 앱',
    category: '학습앱',
    stage: '학교 적용+지속 개선',
    owner: '조미진',
    summary:
      '국어·사회·수학을 연계하여 미추홀구의 도시 문제를 탐구하는 ‘우리땅을 읽걷쓰 AI 도시계획’ 교과 통합 프로젝트 앱입니다. 학생들은 실제 녹지 접근성 분석으로 도시 불균형을 발견하고, 해결 방안과 나만의 도시계획을 설계·발표합니다.',
    url: 'https://projectfor5city-production-ca83.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'class-live-interpreter',
    name: '실시간 통역앱',
    category: '학습앱',
    stage: '학교 적용+지속 개선',
    owner: '박동훈 · 조미진',
    summary:
      '2022 개정 교육과정을 기반으로 다문화 학생에게 교과 개념어와 학습 내용을 정확하게 실시간 통역하는 앱입니다. 수업과 관련 없는 발언은 걸러내고 핵심 학습 내용만 구조화·요약하여 학생의 복습을 돕고 교사의 부담을 줄입니다.',
    url: 'https://classtalk-live-interpreter-production.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'rockam-padlet',
    name: '교내전용 패들렛',
    category: '학습앱',
    stage: '학교 적용+지속 개선',
    owner: '조미진',
    summary:
      '별도 절차 없이 비인증 기반으로 사용할 수 있는 교내전용 패들렛입니다. 저장 모드 사용 시 학급 내 학생 글들이 자동으로 수집됩니다.\n\n향후 아이들의 글쓰기 활동 지원과 자동 문집 완성 등 다양한 기능으로 확대할 예정입니다.',
    url: 'https://2026-rockam.up.railway.app',
    actionLabel: '서비스 체험',
  },
  {
    id: 'notion',
    name: '석암초 돌AI연구소 노션',
    category: '홍보·운영',
    stage: '학교 적용+지속 개선',
    owner: '한희나',
    ownerNote: '관리 및 운영',
    summary:
      '연구소의 프로젝트 정보, 개발 단계, 서비스 링크와 개선 과정을 한곳에서 기록하고 공유하는 운영 채널입니다.',
    url: 'https://app.notion.com/p/AI-39b6de4b73a881c89e81fe2c29f38cbf?source=copy_link',
    actionLabel: '채널 열기',
  },
  {
    id: 'rock-sports',
    name: '체육환경부 서비스',
    category: '개인 실험',
    stage: '아이디어',
    owner: '한희나',
    summary:
      '체육 관련 학교 운영 기능을 실험하고 향후 석암 ON에 통합하기 위한 프로젝트입니다.',
    url: 'https://rock-sports-production.up.railway.app/',
    actionLabel: '서비스 체험',
  },
];
