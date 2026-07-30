# DOL AI LAB Scroll World

돌 AI연구소의 다섯 장면을 하나의 연속 카메라 여정으로 연결한 공식 소개
사이트입니다. Vite, React, TypeScript로 구현했으며 페이지 스크롤 위치를 master
영상의 `currentTime`에 동기화합니다. 아래로 스크롤하면 정방향, 위로 스크롤하면
역방향으로 같은 여정을 탐색합니다.

기준 타임라인은 총 44초입니다.

- 장면 5개 × 5초
- 장면 사이 연결 영상 4개 × 4초
- 엔딩 3초

실제 인코딩 과정에서 중복 경계 프레임이 제거되어 재생 길이가 조금 달라져도,
브라우저가 읽은 실제 영상 길이에 맞춰 스크롤 타임라인을 자동으로 비례 조정합니다.

## 기술 구성

- React 18
- Vite 6
- TypeScript
- CSS 기반 full-viewport sticky 레이아웃
- FFmpeg 기반 로컬 미디어 정규화·연결·QA
- Playwright Core와 Microsoft Edge 기반 브라우저 QA

## 홈페이지 구성

첫 진입 화면에서는 교사·학생·돌봇이 움직이는 별도 무음 반복 영상이 자동 재생되고,
스크롤을 시작하면 44초 Scroll World master로 자연스럽게 이어집니다. 이후 고정
헤더의 네 메뉴로 공식 소개 콘텐츠를 탐색합니다.

1. 연구소 소개 — 핵심 철학, 7단계 운영모델, 운영조직, 6개 향후 운영계획
2. 대표 서비스 — 드라코니스, 돌쇠, 석암 ON, 돌FLIX
3. 연구소 수상 — 교육 공공데이터 AI 활용대회 대상과 법령데이터 공모전 최우수상
4. 서비스 포트폴리오 — 카테고리 필터가 있는 13개 프로젝트

공식 소개 데이터는 [`src/data/labContent.ts`](src/data/labContent.ts)에 타입이
지정된 형태로 관리합니다. 레거시 `LAB/lab-data.js`를 브라우저에 import하거나
배포하지 않으며, 레거시 파일에 있던 접근용 비밀번호도 새 데이터에 포함하지
않습니다. 화면에는 검토된 로컬 이미지 7개만 `public/assets/lab/`에서 사용합니다.

## 실행

의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드와 로컬 미리보기:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Vite preview의 기본 주소는 `http://127.0.0.1:4173`입니다.

## 44초 타임라인

| 시간 | 구간 |
| --- | --- |
| 0–5초 | Scene 1 · DOL AI LAB |
| 5–9초 | Scene 1 → 2 연결 |
| 9–14초 | Scene 2 · 드라코니스 |
| 14–18초 | Scene 2 → 3 연결 |
| 18–23초 | Scene 3 · 학생은 반경으로 걷지 않는다 |
| 23–27초 | Scene 3 → 4 연결 |
| 27–32초 | Scene 4 · 돌쇠 |
| 32–36초 | Scene 4 → 5 연결 |
| 36–41초 | Scene 5 · AI가 연결하는 더 나은 학교 |
| 41–44초 | 메시지 2개와 DOL AI LAB 로고 엔딩 |

장면 순서, 문구, 원본 이미지, 영상 경로, 타임코드는
[`src/data/scenes.ts`](src/data/scenes.ts)에서 관리합니다. 각 장면의
`startTime`, `endTime`, `textStart`, `textEnd`, 텍스트 위치를 수정할 수 있습니다.
master 구성이 달라지면 `TIMELINE_DURATION`과 장면 타임코드를 함께 갱신해야 합니다.

장면 2–4의 중앙 35–65% 구간에는 원본 포스터를 완전히 드러냅니다. 생성 영상에서
변형될 수 있는 한글, UI, 아이소메트릭 구도를 이 안정 구간에서 원본 그대로
보존합니다. 장면 1은 움직이는 영상 프레임을 계속 보여주고, 장면 5는 사용자가
제공한 `scene5_services.png` 한 장만으로 로컬 카메라 이동 영상을 만듭니다.
별도 앱 합성이나 생성형 텍스트 재작성 없이 원본의 한글 픽셀을 그대로 유지합니다.

## master 영상

웹에서 사용하는 파일:

```text
public/generated/master/
  dol-ai-lab-scroll.mp4
  dol-ai-lab-scroll.webm

public/generated/hero/
  dol-ai-lab-living-loop.mp4

public/assets/
  scene5_services.png
```

- 데스크톱은 짧은 GOP로 인코딩한 MP4를 먼저 사용하고 WebM을 폴백으로 사용합니다.
- 현재 모바일 전용 유료 생성을 진행하지 않아 세로 화면도 데스크톱 MP4를
  사용합니다.
- 장면 5는 `assets/scene5_services.png`만 입력으로 사용하며, 의미나 문구를
  추가·교체하지 않습니다.
- 4→5 연결도 생성형 한글이 포함된 기존 영상을 쓰지 않고, 장면 4의 실제 마지막
  프레임과 장면 5 원본 화면을 로컬 크로스페이드로 연결합니다.
- 모바일 UI에서는 영상과 포스터를 `contain`으로 표시해 중앙 크롭을 만들지
  않습니다.
- 모든 master가 없거나 로드에 실패하면 가짜 영상을 만들지 않습니다. 원본 장면
  포스터와 폴백 상태 문구를 표시합니다.

세로 화면의 안정 구간 포스터:

```text
public/generated/frames/mobile/canvases/
  scene01_dol_ai_lab_canvas.png
  scene02_draconis_canvas.png
  scene03_data_map_canvas.png
  scene04_dolsoe_canvas.png
  scene05_services_canvas.png
```

이 캔버스는 원본 장면 전체를 세로 프레임 안에 배치하므로 한글과 UI가 잘리지
않습니다. 가로 모바일에서는 데스크톱 원본과 master를 `contain`으로 표시합니다.

개별 장면과 연결 영상도 다음 경로에 유지합니다.

```text
public/generated/scenes/
public/generated/transitions/
```

## 스크롤 엔진

[`src/hooks/useScrollVideo.ts`](src/hooks/useScrollVideo.ts)는 다음을 담당합니다.

- master를 Blob으로 내려받아 byte-range를 지원하지 않는 정적 서버에서도 전체
  구간을 탐색 가능하게 처리
- `requestAnimationFrame` 기반 스크롤 시간 보간
- 디코더가 seek 중일 때 마지막 요청만 보관하는 seek coalescing
- 정방향과 역방향 스크롤
- iOS 첫 사용자 입력에서 muted `play → pause`로 영상을 준비
- 실제 첫 프레임이 준비될 때까지 포스터 유지
- 소스 변경 시 오래된 video-frame callback과 이벤트 정리
- 모바일 URL 바의 높이 변화만으로 스크롤 매핑이 점프하지 않도록 안정화
- 세로 영상 소스 선택과 coarse-pointer 모바일 UI 판정을 분리

[`src/components/ScrollWorld.tsx`](src/components/ScrollWorld.tsx)는 sticky 무대,
master 영상, 원본 안정 구간, 장면 카피, 진행 표시와 엔딩을 조립합니다.
[`src/components/IntroAmbientVideo.tsx`](src/components/IntroAmbientVideo.tsx)는
첫 진입 화면의 무음 자동재생 반복 영상을 master와 별도로 제어하고, 사용자가
스크롤을 시작하면 숨기고 일시정지합니다.
엔딩 문구는 영상에 굽지 않고 HTML로
`학교를 더 똑똑하게` → `교사의 시간을 학생에게` → DOL AI LAB 로고 순서로
표시합니다.

## 모바일과 모션 감소

- 모바일에서는 데스크톱 master를 `contain`으로 표시해 중앙 크롭을 만들지
  않습니다.
- 장면 안정 구간은 기존 세로 포스터 캔버스를 사용해 한글과 UI를 보존합니다.
- notch와 홈 인디케이터 영역은 CSS `safe-area` 값을 반영합니다.
- `prefers-reduced-motion: reduce`에서는 master 영상을 다운로드하거나 마운트하지
  않습니다.
- 모션 감소 모드는 다섯 원본 장면을 `<picture>`와 `contain`으로 순서대로
  표시하며, 세로 화면에서는 모바일 캔버스를 사용합니다.
- 페이지에는 스크린리더용 H1, 장면 대체 텍스트, 이름이 있는 장면 이동 버튼과
  진행 상태 live region이 포함됩니다.

## 브라우저 QA

먼저 preview 서버를 실행합니다.

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

다른 터미널에서 QA를 실행합니다.

```bash
npm run qa:browser
```

QA는 기본적으로 설치된 Microsoft Edge를 headless Chromium으로 사용하고 다음을
검사합니다.

- 데스크톱 master 로드와 5개 장면 이동 버튼
- 첫 화면 반복 영상의 자동재생·반복·실제 시간 진행과 스크롤 뒤 일시정지
- 장면 1의 고대비 카피 박스와 master 영상 유지, 장면 5의 중복 카피 제거
- 마지막 흰색·금색 HTML 로고 표시
- 아래·위 스크롤에 따른 정방향·역방향 시간 이동
- 모바일 영상과 포스터의 `contain` 적용
- 모션 감소 모드에서 영상이 없고 정적 장면 5개가 제공되는지 여부
- 정확한 네 메뉴와 단일 `<main>`, 각 메뉴 앵커 이동
- 운영모델 7단계, 조직 4개 부서, 향후계획 6개, 대표 서비스 4개, 수상 2개
- 포트폴리오 13개와 카테고리 필터
- 레거시 접근용 계정 문자열이 화면에 노출되지 않는지 여부
- 콘솔 오류, 페이지 오류, 실패한 네트워크 요청

결과와 스크린샷은 `artifacts/`에 저장됩니다.

```text
artifacts/
  browser-qa.json
  desktop-start.png
  desktop-original-band.png
  desktop-reverse.png
  desktop-transition-five-early.png
  desktop-transition-five-late.png
  desktop-scene-five-overview.png
  desktop-scene-five-push-in.png
  desktop-scene-five-community.png
  desktop-scene-five-finale.png
  desktop-ending.png
  desktop-content-intro.png
  desktop-content-operating-model.png
  desktop-content-organization.png
  desktop-content-roadmap.png
  desktop-content-featured.png
  desktop-content-awards.png
  desktop-content-portfolio.png
  mobile-scene.png
  mobile-content-intro.png
  reduced-motion.png
```

다른 주소나 브라우저 실행 파일을 사용하려면 `QA_BASE_URL`,
`QA_BROWSER_PATH` 환경 변수를 지정합니다.

## 미디어 파이프라인

전체 절차와 입력 파일명은
[`scripts/media/README.md`](scripts/media/README.md)를 참고합니다. 이 로컬
파이프라인은 Higgsfield를 호출하지 않으며 크레딧이나 결제를 발생시키지 않습니다.

주요 명령:

```powershell
.\scripts\media\New-ZeroCostMotionEdits.ps1
.\scripts\media\New-PortraitCanvases.ps1
.\scripts\media\Invoke-MediaPipeline.ps1 -Force
```

`New-ZeroCostMotionEdits.ps1`은 첫 화면 무음 반복 영상을 로컬에서 만듭니다.
현재 장면 5 체인은 사용자가 Higgsfield에서 내려받은 두 원본을 사용합니다.
첫 영상은 돌쇠 모니터에서 서비스 전체 화면으로 카메라가 빠져나오고, 두 번째
영상은 같은 전체 화면에서 교사·학생·돌봇 공동체로 부드럽게 진입합니다.
파이프라인은 두 영상과 인접 장면을 30fps로 정규화한 뒤 실제 경계 프레임에
8프레임씩 잠가 한글이 겹쳐 보이는 긴 크로스페이드 없이 연결합니다.

`New-ZeroCostMotionEdits.ps1 -ApplySceneFive`는 예전 로컬 카메라 편집본으로
장면 5 원본을 교체하는 복구용 옵션이므로 현재 최종본에서는 실행하지 않습니다.

화면을 비우는 실험용 초안 한 장은 OpenAI 내장 이미지 편집으로 만들었지만,
주변 한글 보존 결과가 원본보다 좋지 않아 최종본에는 사용하지 않았습니다. 해당
프롬프트는 `generation/prompts/local/scene5_screen_cleanup.txt`에 기록했습니다.
최종 조립은 내려받은 완성 영상을 로컬 FFmpeg로 처리하며 추가 Higgsfield 작업을
제출하지 않고 크레딧도 사용하지 않습니다.

모바일 전용 영상 생성과 master 조립은 사용자 요청으로 중단했습니다. 현재 빌드는
데스크톱 master를 `contain`으로 재사용하며 중앙 크롭하지 않습니다. 남아 있는
`-IncludeMobile` 옵션은 향후 명시적으로 재개하고 네이티브 9:16 장면 5개와 연결
영상 4개가 모두 준비된 경우에만 사용합니다.

파이프라인은 다음 작업을 수행합니다.

- 장면과 연결 영상의 해상도·프레임레이트·색상·GOP 정규화
- 실제 이전 장면 마지막 프레임과 다음 장면 첫 프레임을 이용한 연결점 잠금
- 각 클립의 중복 경계 프레임 제거 후 하나의 master로 연결
- Scene 5 마지막 프레임에서 남색으로 페이드되는 깨끗한 3초 엔딩 생성
- 고대비 로고는 영상에 굽지 않고 접근 가능한 HTML/SVG로 표시
- 데스크톱 MP4·WebM 및 선택적 모바일 MP4·WebM 생성
- 장면 길이, 연결 길이, 약 44초 master, seam, 해상도와 keyframe 간격 검사
- `public/generated/master/media-qa.json` 작성

Render 배포본은 1080p·30fps와 GOP 8을 유지하면서 데스크톱 master를 CRF 24로
인코딩합니다. 기존 CRF 20 master 대비 SSIM 0.989를 확인했으며, 파일은 약
64MB에서 약 42MB로 줄였습니다. WebM과 개별 장면·연결 파일은 로컬 파이프라인
검증용으로 보존하지만 실제 배포 저장소에는 MP4 master만 포함합니다.

원본 렌더를 바꾼 뒤 최종 산출물을 다시 만들 때는 `-Force`를 사용합니다. 기존
세로 seed canvas는 `-Force` 실행에서도 보존됩니다.

## 주요 파일

- `src/data/scenes.ts`: 44초 타임라인, 문구, 자산과 master 경로
- `src/hooks/useScrollVideo.ts`: Blob 로드와 스크롤·영상 동기화
- `src/components/PosterStack.tsx`: 데스크톱·세로 포스터 선택과 원본 안정 구간
- `src/components/SceneOverlay.tsx`: 장면별 HTML 카피
- `src/components/IntroAmbientVideo.tsx`: 첫 화면 자동재생 반복 영상
- `src/components/EndSequence.tsx`: 고대비 HTML/SVG 엔딩 브랜드
- `src/components/ReducedMotionExperience.tsx`: 모션 감소 정적 여정
- `src/styles/global.css`: 브랜드 색상, 반응형 레이아웃, safe area와 접근성
- `src/data/labContent.ts`: 소개, 조직, 서비스, 수상, 13개 프로젝트의 검토된 데이터
- `src/components/LabHomepage.tsx`: Scroll World 뒤의 다섯 공식 콘텐츠 섹션
- `src/components/SiteHeader.tsx`: 다섯 앵커와 활성 상태를 제공하는 고정 헤더
- `src/styles/content.css`: 공식 소개 섹션의 데스크톱·390px 편집 디자인
- `scripts/media/`: 로컬 FFmpeg 미디어 파이프라인
- `scripts/media/New-ZeroCostMotionEdits.ps1`: 무과금 첫 화면·장면 5 재편집
- `scripts/qa-browser.mjs`: 데스크톱·모바일·모션 감소 브라우저 QA
- `generation/prompts/`: Higgsfield 장면·연결 생성 프롬프트 기록
- `generation/jobs.json`: 작업 ID, 활성 장면, 모바일 중단 상태와 무과금 검증 기록

## 캐릭터 reference 교체

Higgsfield 장면 재생성에 사용하는 reference 원본:

```text
assets/characters/female_teacher_reference*.png
assets/characters/male_teacher_reference*.png
assets/characters/dolbot_reference*.png
```

reference를 교체할 때는 `assets/characters/`의 원본을 바꾸고 Higgsfield reusable
element를 갱신한 뒤 관련 장면과 연결 영상을 다시 생성합니다. 웹용 복사본도
`public/assets/characters/`에 같은 파일명으로 반영해야 합니다.

## GitHub · Render 배포

루트의 `render.yaml`은 Render Static Site 배포를 위해 다음 값을 고정합니다.

- 빌드: `npm ci && npm run build`
- 게시 폴더: `dist`
- SPA 경로: 모든 앱 경로를 `/index.html`로 rewrite
- 자동 배포: `main` 브랜치에 새 커밋이 올라오면 재배포
- PR 미리보기: 불필요한 빌드를 막기 위해 비활성화

GitHub 저장소 연결과 Render Dashboard 설정에 사용할 명령은
[`DEPLOY.md`](DEPLOY.md)에 정리했습니다. `generation`의 원본 렌더와 `LAB`,
로컬 QA 캡처는 삭제하지 않고 로컬에 보존하되 배포 저장소에는 포함하지 않습니다.
