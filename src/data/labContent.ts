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
  area: ProjectFilter;
  category: string;
  summary: string;
  image: string;
  imageAlt: string;
  imageFit: 'cover' | 'contain';
  url: string;
  actionLabel: string;
  recognition?: string;
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
  badgeImage?: string;
  badgeImageAlt?: string;
  stats: Array<{ value: string; label: string }>;
  reportUrl: string;
  serviceUrl: string;
};

export const projectCategories = [
  '전체',
  '학생지원',
  '학교안전',
  '학교행정',
] as const;

export type ProjectCategory = (typeof projectCategories)[number];
export type ProjectFilter = Exclude<ProjectCategory, '전체'>;

export type Project = {
  id: string;
  name: string;
  category: ProjectFilter;
  subgroup: string;
  audience: string;
  relatedTo?: string;
  stage: '구조 확인' | '확인 전';
  owner?: string;
  ownerNote?: string;
  summary: string;
  url: string | null;
  actionLabel: string;
};

export const serviceAreas: Array<{
  id: 'student' | 'safety' | 'admin';
  name: ProjectFilter;
  eyebrow: string;
  summary: string;
  groups: Array<{ name: string; description: string }>;
}> = [
  {
    id: 'student',
    name: '학생지원',
    eyebrow: 'LEARN & GROW',
    summary:
      '드라코니스를 중심으로 교과와 프로젝트에서 직접 배우고 만드는 경험, 학교생활과 학습을 꾸준히 돕는 서비스를 연결합니다.',
    groups: [
      {
        name: '교과·프로젝트 학습',
        description:
          '드라코니스, 도시개발 프로젝트, 우리학교 모의투자, 교내 협업 보드로 탐구하고 결과물을 함께 만듭니다.',
      },
      {
        name: '학생생활·학습지원',
        description:
          '명상, 다문화 통번역, 앱 나눔뜰, 3D 학교 공간과 드라코니스의 생활·신체활동으로 배움의 일상을 돕습니다.',
      },
    ],
  },
  {
    id: 'safety',
    name: '학교안전',
    eyebrow: 'CARE & PROTECT',
    summary:
      '반경너머를 대표로, 교직원이 살펴보는 안전지원과 학부모·학교 방문자가 직접 이용하는 안전서비스를 구분합니다.',
    groups: [
      {
        name: '교직원용 안전지원',
        description:
          '반경너머와 아차 우산으로 학교 주변 환경과 등하교 기상을 살펴보고, 위기학생 조기 발견·대응 방안을 검토합니다.',
      },
      {
        name: '학부모·외부인용 안전서비스',
        description:
          '일일방문증과 안전급식 알리미에서 방문 절차와 급식·알레르기 정보를 확인합니다.',
      },
    ],
  },
  {
    id: 'admin',
    name: '학교행정',
    eyebrow: 'PLAN & CONNECT',
    summary:
      '돌쇠와 석암 뷔페를 대표로 소개합니다. 석암 뷔페를 교직원 업무의 중심 포털로 확장해 여러 도구에 한곳에서 접근하는 구조를 지향합니다.',
    groups: [
      {
        name: '교직원 업무 플랫폼',
        description:
          '석암 뷔페는 교육과정 설계·운영을, 돌쇠는 법령 검토를 지원하며 교직원의 판단과 실행을 돕습니다.',
      },
      {
        name: '함께 연결할 업무 도구',
        description:
          '가정통신문 번역, 코딩·AI 사용량 관리, 배너 공방, 협의보드, 업무 지식그래프를 한곳에서 찾습니다. 석암 뷔페 안에서도 바로 접근하도록 연결하는 방향을 검토합니다.',
      },
      {
        name: '핵심 운영 지원',
        description:
          '석암 ON은 보결관리와 정보화기기·컴퓨터 정보 관리 중심으로 정리하고, 나머지 기능은 석암 뷔페의 관련 업무 메뉴로 연결하는 방향을 검토합니다.',
      },
    ],
  },
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
      names: ['이창성', '이남건', '한희나', '김종섭', '김한일'],
    },
    {
      role: '연구원',
      names: ['안상우', '박서영', '한은서', '이혜경', '홍승유', '석혜숙'],
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
    area: '학생지원',
    category: '개인 맞춤 교수·학습',
    summary:
      '드라코니스는 2022 개정 교육과정의 수학·국어·영어 학습을 게임형 모험으로 구성한 개인 맞춤 교수·학습 지원 시스템입니다. 학생은 미션을 해결하고 드래곤을 성장시키며 CLA 단계별 풀이(문제 파악 → 계산 과정 → 최종 확인)를 익히고, 어휘·독해·영어 기초 학습과 운동 활동을 한곳에서 이어갑니다. 교사는 학급·학생별 참여 현황, 개념별 성취도와 오개념, 풀이 경로를 확인해 보충 학습과 맞춤형 지도를 제공할 수 있습니다.',
    image: '/assets/lab/draconis-world-card.png',
    imageAlt: '여섯 드래곤과 학생 모험가들이 함께하는 드라코니스 세계관',
    imageFit: 'contain',
    url: 'https://draconis.up.railway.app/',
    actionLabel: '서비스 체험',
  },
  {
    id: 'beyond-radius',
    name: '반경너머',
    area: '학교안전',
    category: '학교 주변 환경·도보 접근성',
    summary:
      '학교 주변을 직선 반경과 실제 도보 도달권으로 비교하고, 공공데이터의 학교별 지표와 출처를 함께 살펴보는 교육자원 분석 도구입니다. 학교 찾기, AI 도우미, 전체 통계 등을 통해 교직원이 학교 주변 환경과 지원 우선순위를 검토하도록 돕습니다.',
    image: '/assets/lab/beyond-radius-overview.png',
    imageAlt: '반경너머 학교 주변 환경과 도보 접근성 분석 화면',
    imageFit: 'cover',
    url: 'https://park-analysis-web-production.up.railway.app/',
    actionLabel: '서비스 열기',
  },
  {
    id: 'dolsoe',
    name: '돌쇠',
    area: '학교행정',
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
    id: 'seokam-buffet',
    name: '석암 뷔페',
    area: '학교행정',
    category: '교육과정 설계·교직원 업무',
    summary:
      '학생의 학습·활동 자료와 연구·실천 전략을 바탕으로 교육적 우선순위를 정하고, 교육과정·시수·시간표·주간 안내 작성과 학급 운영으로 연결하는 AI 지원 플랫폼입니다. 가정통신문 번역과 AI 사용량 관리 등 업무 도구를 연결하는 교직원 통합 포털로의 확장을 검토합니다.',
    image: '/assets/lab/seokam-buffet-overview.png',
    imageAlt: '석암 뷔페 교육과정 설계와 교사의 의사결정 과정 안내 화면',
    imageFit: 'cover',
    url: 'https://preview-production-5c3b.up.railway.app/admin/ops',
    actionLabel: '서비스 열기',
  },
];

export const awards: Award[] = [
  {
    id: 'dolsoe-award',
    eyebrow: '제2회 법령데이터 활용 아이디어 공모전',
    award: '제품·서비스 개발 부문 전국 최우수상 · 법제처장상',
    title: 'AI 학교 사업 계획\n법령 검토 비서,\n돌쇠',
    team: '개발 · 박동훈',
    recognition: '왕중왕전 진출',
    summary:
      '학교 사업계획과 최신 법령을 연결해 준수·누락·위반 가능성과 수정 권고를 제시합니다.',
    image: '/assets/lab/dolsoe-research/dolsoe-page-01.png',
    imageAlt: 'AI 학교 사업계획 법령 검토 비서 돌쇠 소개서 표지',
    stats: [
      { value: '약 400개', label: '초등학교 관련 법령' },
      { value: '10개', label: '검토 분야' },
      { value: '7,700 → 10', label: '전국 본선 결과' },
    ],
    reportUrl: 'https://lab-tq11.onrender.com/dolsoe.html',
    serviceUrl: 'https://schoollaw-review-production.up.railway.app/web/',
  },
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
    badgeImage: '/assets/lab/education-ministry-digital-badge.png',
    badgeImageAlt: '교육부 제8회 교육 공공데이터 AI 활용대회 대상 디지털 뱃지',
    stats: [
      { value: '242교', label: '분석 대상 초등학교' },
      { value: '20종', label: '공공·행정·공간 데이터' },
      { value: '67.4%', label: '도보권 녹지 5% 미만' },
    ],
    reportUrl: 'https://lab-tq11.onrender.com/bangyeong.html',
    serviceUrl: 'https://park-analysis-web-production.up.railway.app/',
  },
];

export const projects: Project[] = [
  {
    id: 'draconis',
    name: 'DRACONIS 드라코니스',
    category: '학생지원',
    subgroup: '교과·프로젝트 학습',
    audience: '학생·교사',
    stage: '구조 확인',
    owner: '조미진',
    summary:
      '교과학습과 석암 히어로·신체활동을 연결하고, 학생 성장과 학교 참여 기록을 함께 살펴보는 개인 맞춤 교수·학습 지원 플랫폼입니다.',
    url: 'https://draconis.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'michuhol-city-development',
    name: '우리 땅을 읽걷쓰AI 도시개발 프로젝트',
    category: '학생지원',
    subgroup: '교과·프로젝트 학습',
    audience: '학생·교사',
    stage: '구조 확인',
    summary:
      '실제 미추홀구 지도와 시설·학교·안전 자료를 읽고 예산과 생활권을 고려해 도시계획을 설계합니다. 사회의 지역 문제 탐구, 수학의 거리·예산 판단, 국어의 계획 설명을 연결하는 교과 통합 프로젝트입니다.',
    url: 'https://projectfor5city-production-ca83.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'school-stock',
    name: '우리학교 모의투자',
    category: '학생지원',
    subgroup: '교과·프로젝트 학습',
    audience: '학생·교사',
    stage: '구조 확인',
    summary:
      '실제 돈을 사용하지 않는 학교용 모의투자 앱입니다. 공식 지연 시세를 기준으로 투자 기록을 살펴보며 경제와 금융을 학습합니다.',
    url: 'https://classstock-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'rockam-padlet',
    name: 'ROCKAM 교내 협업 보드',
    category: '학생지원',
    subgroup: '교과·프로젝트 학습',
    audience: '학생·교사',
    stage: '구조 확인',
    summary:
      '교사가 학급 활동 주제와 글쓰기 규칙을 제시하고, 학생이 문제상황·의견·근거를 카드로 공유합니다. 댓글과 좋아요로 서로의 생각을 나누는 교실 활동 보드입니다.',
    url: 'https://2026-rockam.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'morning-walk',
    name: '아침 걷기 신체활동 기록·관리 앱',
    category: '학생지원',
    subgroup: '학생생활·학습지원',
    audience: '학생·교사',
    relatedTo: '드라코니스 연계 기능',
    stage: '구조 확인',
    summary:
      '드라코니스의 생활·운동 영역과 연결된 아침 걷기 항목입니다. 학생의 신체활동 기록과 학교생활을 함께 살펴보는 연계 기능으로 안내합니다.',
    url: 'https://draconis.up.railway.app/',
    actionLabel: '드라코니스 열기',
  },
  {
    id: 'seokam-hero',
    name: '석암 HERO 인성·봉사 프로젝트',
    category: '학생지원',
    subgroup: '학생생활·학습지원',
    audience: '학생·교사',
    relatedTo: '드라코니스 연계 기능',
    stage: '구조 확인',
    summary:
      '드라코니스 생활 영역의 석암 히어로 메뉴와 연결된 인성·봉사 항목입니다. 학생의 학교 참여와 성장을 살펴보는 연계 기능으로 안내합니다.',
    url: 'https://draconis.up.railway.app/',
    actionLabel: '드라코니스 열기',
  },
  {
    id: 'dolflix',
    name: '돌Flix 명상 앱',
    category: '학생지원',
    subgroup: '학생생활·학습지원',
    audience: '학생·교직원',
    stage: '구조 확인',
    summary:
      '학생과 교원이 명상·이완 영상과 마음 쉬기 콘텐츠를 찾아 활용하는 페이지입니다. 학교생활 속 정서적 회복과 휴식을 돕습니다.',
    url: 'https://school-meditation-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'class-live-interpreter',
    name: '실시간 다문화 통번역 학습지원 앱',
    category: '학생지원',
    subgroup: '학생생활·학습지원',
    audience: '다문화 학생·교사',
    stage: '구조 확인',
    summary:
      '교사의 수업 내용을 학생별 언어로 전달하고 핵심 학습 내용을 구조화하는 다문화 학습 지원 앱입니다. 교과 개념의 이해와 수업 후 복습을 돕습니다.',
    url: 'https://classtalk-live-interpreter-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'app-garden',
    name: '앱 나눔뜰',
    category: '학생지원',
    subgroup: '학생생활·학습지원',
    audience: '학생·교사',
    stage: '구조 확인',
    summary:
      '학생이 만든 앱을 게시하고 친구의 작품을 찾아 실행·공유하는 학교 앱 공간입니다. 교사는 작품과 댓글, AI 사용량을 함께 확인합니다.',
    url: 'https://garden-production-35fd.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'school-memory-3d',
    name: '3D 학교 공간 기억',
    category: '학생지원',
    subgroup: '학생생활·학습지원',
    audience: '학생·학교 구성원',
    stage: '구조 확인',
    summary:
      '아바타로 실제 학교를 본뜬 3D 공간을 탐험하는 학교 공간 기억 프로젝트입니다. 학교의 공간을 온라인에서 만나고 둘러봅니다.',
    url: 'https://school-tour-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'beyond-radius',
    name: '반경너머, 도달 가능성으로',
    category: '학교안전',
    subgroup: '교직원용 안전지원',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '학교 주변을 직선 반경과 실제 도보 도달권으로 비교하고, 공공데이터의 학교별 지표와 출처를 함께 검토하는 교육자원 분석 도구입니다.',
    url: 'https://park-analysis-web-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'umbrella',
    name: '아차 우산!',
    category: '학교안전',
    subgroup: '교직원용 안전지원',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '등·하교 시간대의 기상 예보를 바탕으로 우산 준비를 안내하는 생활 지원 앱입니다. 교직원이 날씨에 따른 등하교 안내를 준비하도록 돕습니다.',
    url: 'https://acha-umbrella-monitor-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'crisis-support',
    name: '위기학생 조기 발견·대응 앱',
    category: '학교안전',
    subgroup: '교직원용 안전지원',
    audience: '교직원',
    stage: '확인 전',
    summary:
      '누적된 지각 등 생활 기록에서 지원이 필요한 신호를 살펴보기 위해 검토 중인 앱입니다. 구체적인 기능과 연결 주소는 확인 전입니다.',
    url: null,
    actionLabel: '연결 준비 중',
  },
  {
    id: 'visitor-pass',
    name: '일일방문증 앱',
    category: '학교안전',
    subgroup: '학부모·외부인용 안전서비스',
    audience: '학부모·학교 방문자',
    stage: '구조 확인',
    summary:
      '방문 목적과 시간을 사전에 확인하고 일일 방문 절차와 출입 이력을 관리하는 서비스입니다. 학교 방문자의 신청과 안내를 지원합니다.',
    url: 'https://visitor-pass-production.up.railway.app/visitor-pass',
    actionLabel: '앱 열기',
  },
  {
    id: 'food-allergy',
    name: '안전급식 알리미 앱',
    category: '학교안전',
    subgroup: '학부모·외부인용 안전서비스',
    audience: '학부모·학생',
    stage: '구조 확인',
    summary:
      '급식 메뉴와 알레르기 정보를 쉽게 확인하도록 지원하는 학교 급식 안내 서비스입니다.',
    url: 'https://food-allergy-production.up.railway.app/#/setup',
    actionLabel: '앱 열기',
  },
  {
    id: 'seokam-buffet',
    name: '석암 뷔페',
    category: '학교행정',
    subgroup: '교직원 업무 플랫폼',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '학생의 학습·활동 자료와 연구·실천 전략을 교육과정·시수·시간표·주간 안내와 학급 운영으로 연결하는 AI 지원 플랫폼입니다. 여러 업무 도구에 한곳에서 접근하는 교직원 통합 포털로의 확장을 검토합니다.',
    url: 'https://preview-production-5c3b.up.railway.app/admin/ops',
    actionLabel: '앱 열기',
  },
  {
    id: 'dolsoe',
    name: '학교 법령검토 시스템 돌쇠',
    category: '학교행정',
    subgroup: '교직원 업무 플랫폼',
    audience: '교직원',
    stage: '확인 전',
    summary:
      '학교 사업계획서를 올리거나 내용을 입력해 관련 법령·조례·지침에 따른 검토 근거와 수정 권고를 확인하도록 만든 도구입니다. 교직원이 근거를 살펴보고 최종 판단하도록 돕습니다.',
    url: 'https://schoollaw-review-production.up.railway.app/web/',
    actionLabel: '앱 열기',
  },
  {
    id: 'schoolletter',
    name: '다문화 가정통신문 번역 앱',
    category: '학교행정',
    subgroup: '함께 연결할 업무 도구',
    audience: '교직원·다문화 가정',
    stage: '구조 확인',
    summary:
      '가정통신문의 QR을 통해 보호자가 필요한 언어로 본문을 읽고 내려받도록 지원하는 번역 서비스입니다.',
    url: 'https://schoolletter-java-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'school-ai-admin',
    name: '학교 코딩 AI 안전·사용량 관리',
    category: '학교행정',
    subgroup: '함께 연결할 업무 도구',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '학생별·학급별 AI 사용을 교사가 관리하고, 학교 예산과 안전장치를 함께 살펴보는 대시보드입니다.',
    url: 'https://school-ai-admin-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'banner-factory',
    name: '석암 배너 공방',
    category: '학교행정',
    subgroup: '함께 연결할 업무 도구',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '학교 행사·기념일·캠페인 배너를 분류와 검색으로 고르고 제작하는 학교용 배너 공방입니다.',
    url: 'https://banner-factory-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'staffroom',
    name: '석암 협의보드',
    category: '학교행정',
    subgroup: '함께 연결할 업무 도구',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '학교의 문제와 교육계획을 안건으로 모으고 교직원 협의·교장 검토·경과보고를 연결해, 결정과 실행 과정을 함께 살펴보는 협의보드입니다.',
    url: 'https://staffroom-production.up.railway.app/staffroom',
    actionLabel: '앱 열기',
  },
  {
    id: 'knowledge-graph',
    name: '업무 지식그래프 · 교육이음',
    category: '학교행정',
    subgroup: '함께 연결할 업무 도구',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '전년도 자료에 질문하고, 붙임과 작성 양식을 근거로 공문 초안을 작성·검토하는 교육이음 프로토타입입니다.',
    url: 'https://readwalk-app-production.up.railway.app/',
    actionLabel: '앱 열기',
  },
  {
    id: 'seokam-on',
    name: '석암 ON',
    category: '학교행정',
    subgroup: '핵심 운영 지원',
    audience: '교직원',
    stage: '구조 확인',
    summary:
      '현재 교직원 업무와 학생·학부모 학교생활을 두 입구로 나누고 다양한 학교 서비스를 안내합니다. 보결관리와 정보화기기·컴퓨터 정보 관리 중심으로 정리하는 방향을 검토합니다. ‘2026년 학교 행정업무 경감 및 효율화 과제 공모전’ 우수제안작품으로 선정되었습니다.',
    url: 'https://disciplined-happiness-production-ad86.up.railway.app/',
    actionLabel: '앱 열기',
  },
];

export const legacyResources: Array<{
  id: string;
  name: string;
  url: string;
  summary: string;
}> = [
  {
    id: 'press-release',
    name: '보도자료앱',
    url: 'https://ai-html-production.up.railway.app/ai.html',
    summary: '학교 활동을 보도자료 형식으로 작성하고 관리하는 기존 서비스입니다.',
  },
  {
    id: 'notion',
    name: '석암초 돌AI연구소 노션',
    url: 'https://app.notion.com/p/AI-39b6de4b73a881c89e81fe2c29f38cbf?source=copy_link',
    summary: '연구소의 프로젝트와 개발 과정, 서비스 링크를 기록하는 운영 채널입니다.',
  },
  {
    id: 'rock-sports',
    name: '체육환경부 서비스',
    url: 'https://rock-sports-production.up.railway.app/',
    summary: '체육 관련 학교 운영 기능을 실험한 기존 프로젝트입니다.',
  },
];
