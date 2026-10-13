# DOL AI LAB 홈페이지

돌 AI연구소의 소개와 학교 앱을 탐색하는 공식 홈페이지입니다. Vite, React,
TypeScript로 구현했으며, 첫 방문에는 스크롤로 움직이는 소개 여정을 제공합니다.
마지막의 **홈페이지 들어가기**를 누르면 **연구소 소개 / 전체 앱** 두 메뉴에서
필요한 화면을 선택합니다. 홈페이지 안에서는 선택한 화면만 표시합니다.

기본 주소 또는 저장된 연구소 소개 주소(`#/about`, `#lab-intro`)를 새로 열면
소개영상부터 시작합니다. 영상의 ‘홈페이지 바로가기’와 내부 메뉴로는 바로
연구소 소개에 들어가며, 수상·운영조직·앱의 개별 주소는 해당 화면으로 연결됩니다.

소개 영상은 첫 스크롤 여정에서 사용합니다. 홈페이지 진입 후에는 첫 장면 이미지를
화면 전체 배경으로 사용하고, 아이보리 그라데이션 위에 큰 초록색 제목으로 소개합니다.
헤더는 다른 페이지와 같은 아이보리·초록 디자인이며, 둥근 버튼과 하단의 네 카드에서
앱과 수상 화면으로 이동합니다. 카드 숫자는 실제 앱·기능 및 수상 목록에서 계산합니다.
PC 소개는 총 54초·6장면의 카메라 여정입니다. 학교에서 드라코니스로 들어가고,
용이 있는 하늘과 반경너머의 도로를 지나 돌쇠·앱나눔뜰·학교 공동체·로고로 이어집니다.
기존 영상의 중앙 23초를 재사용하며, 새 구간은 금빛과 돌봇을 따라 공간 안으로 이동합니다.
PC 첫 화면의 제목·부제와 학생지원·학교안전·학교행정 배지는 원본 그림의
해당 영역을 별도로 표시해 생성 영상 속 한글 변형을 가립니다. 사람과 돌봇은
master 영상으로 계속 움직이며, 스크롤로 출발하면 글씨 영역만 부드럽게 사라집니다.
앱나눔뜰에서는 돌봇이 제자리에서 반응하고, 금빛과 카메라가 학생의 타이핑을 가까이
보여준 뒤 노트북 화면 안으로 들어가 학교 공동체 장면으로 이어집니다.
세부 제작 기록과 로컬 조립 방법은 로컬 `generation/intro-v3/` 폴더에 보관합니다.

모바일은 별도로 생성한 9:16·720×1280 영상으로 총 51초입니다.
학교 → 드라코니스 → 돌쇠 → 반경너머 → 앱나눔뜰 → 학교 공동체 → 로고 순서이며,
돌봇이 처음과 마지막 문을 안내하고 중간은 용과 금빛, 카메라가 이동을 이끕니다.
글씨를 포함한 세로 구도 전체를 보존하며, 영상 하나를 앞뒤로 스크롤합니다.
세부 제작 기록은 로컬 `generation/intro-mobile-v3/` 폴더에 보관합니다.
아래 기존 44초 미디어 파이프라인 설명은 이전 영상의 제작 기록입니다.

스크롤 엔진은 첫 소개에서만 마운트하고 홈페이지에 들어오면 정리합니다.
영상 위의 큰 흰색 ‘홈페이지 바로가기’와 홈페이지 하단의 큰 초록색 ‘처음 소개영상 다시보기’ 버튼도 제공합니다.

## 기술 구성

- React 18
- Vite 6
- TypeScript
- 해시 주소 기반 화면 전환과 반응형 펼침 메뉴
- FFmpeg 기반 로컬 미디어 정규화·연결·QA
- Playwright Core와 Microsoft Edge 기반 브라우저 QA

## 홈페이지 구성

첫 화면은 PC 여섯 장면과 로고, 모바일 일곱 장면의 스크롤 여정이며 끝에서 홈페이지로 연결됩니다. 홈페이지의 상단 두 메뉴는 클릭하면
하위 메뉴가 펼쳐지며, Escape·바깥 클릭·키보드 초점 이동으로 닫힙니다.

| 메뉴 | 화면 주소 | 내용 |
| --- | --- | --- |
| 첫 소개 | `/` 또는 `#/intro` | 스크롤 여정과 홈페이지 들어가기 |
| 연구소 소개 | `#/about` | 넓은 이미지 배경·아이보리/초록 소개·둥근 바로가기 카드 |
| 연구소 소개 → 연구소 수상 | `#/about/awards` | 금색·남색 전시형 수상 카드 두 개 |
| 연구소 소개 → 운영조직 | `#/about/organization` | 구성원과 네 부서 |
| 전체 앱 | `#/apps` | 세 영역 진입 카드와 통합 검색 |
| 전체 앱 → 학생지원 | `#/apps/student` | 드라코니스 대표, 10개 앱·기능 |
| 전체 앱 → 학교안전 | `#/apps/safety` | 반경너머 대표, 5개 앱 |
| 전체 앱 → 학교행정 | `#/apps/admin` | 돌쇠·석암 뷔페 대표, 8개 앱 |

영역별 앱은 6개씩 표시하고 활용 목적과 이용 대상에 따라 필터링합니다. 전체 설명은
상세 대화상자에서 확인하며, 드라코니스 소개 자료·학습 화면과 행정 통합 제안은
요청할 때 펼칩니다. 앱 담당자는 드라코니스의 조미진만 표시합니다. 운영조직과 수상 기록의
이름은 별도 정보로 유지합니다. 기존 `#lab-*` 링크도 해당 화면으로 연결됩니다.

대표 앱은 각 영역 상단에 큰 이미지로 소개합니다. 드라코니스는 세계관 이미지를
대표로 사용하고, 소개 자료와 학습 화면은 큰 글씨·이미지 확대·원본 보기로 확인합니다.

2026-10-10에 [석암 프로젝트 통합센터](https://seokam-review-hub-production.up.railway.app/)
공개 목록과 전체 구성 의견을 확인해 분류와 연결 주소를 반영했습니다. 아침 걷기와
석암 HERO는 독립 앱으로 중복 소개하지 않고 드라코니스의 연계 기능으로 표시합니다.
기존 보도자료앱·연구소 노션·체육환경부 링크는 접을 수 있는 이전 프로젝트 목록에 보존합니다.

석암 뷔페 중심의 외부 업무 도구 연계와 석암 ON 핵심 기능 정리는 **검토 중인 방향**입니다.
홈페이지에서 업무 앱으로 직접 연결하며, 다른 앱의 코드나 로그인 체계는 변경하지 않습니다.
리뷰 허브의 참여 코드와 내부 인증 정보는 배포 콘텐츠에 포함하지 않습니다.

공식 소개 데이터는 [`src/data/labContent.ts`](src/data/labContent.ts)에 타입이
지정된 형태로 관리합니다. 레거시 `LAB/lab-data.js`를 브라우저에 import하거나
배포하지 않으며, 레거시 파일에 있던 접근용 비밀번호도 새 데이터에 포함하지
않습니다. 화면에는 검토된 로컬 이미지를 `public/assets/lab/`에서 사용합니다.
`beyond-radius-overview.png`와 `seokam-buffet-overview.png`는 리뷰 허브의 공개 상세 화면에서
가져왔으며, 석암 뷔페 이미지는 더미 데이터를 사용하는 미리보기 화면입니다.

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

## 첫 소개의 스크롤 엔진

루트 주소와 `#/intro`에서 사용하며, 홈페이지 내부 화면에서는 마운트하지 않습니다.

[`src/hooks/useScrollVideo.ts`](src/hooks/useScrollVideo.ts)는 다음을 담당합니다.

- master URL을 video에 직접 연결해 전체 다운로드 전에 첫 프레임을 표시
- HTTP byte-range를 지원하는 서버에서 스크롤한 구간을 우선 로드
- `requestAnimationFrame` 기반 스크롤 시간 보간
- PC 첫 화면은 같은 master의 첫 0.85초를 부드럽게 왕복하며, 스크롤 시작 시 현재 프레임에서 이어짐
- 디코더가 seek 중일 때 마지막 요청을 보관하고, 멀리 이동한 새 요청은 이전 탐색을 대체
- 네트워크 탐색 중 설명·수상 배지·첫 글씨는 마지막으로 표시된 영상 프레임에 맞춰 유지
- 정방향과 역방향 스크롤
- iOS 첫 사용자 입력에서 muted `play → pause`로 영상을 준비
- 실제 첫 프레임이 준비될 때까지 포스터 유지
- 소스 변경 시 오래된 video-frame callback과 이벤트 정리
- 모바일 URL 바의 높이 변화만으로 스크롤 매핑이 점프하지 않도록 안정화
- 세로 영상 소스 선택과 coarse-pointer 모바일 UI 판정을 분리

[`src/components/ScrollWorld.tsx`](src/components/ScrollWorld.tsx)는 sticky 무대,
master 영상, 원본 안정 구간, 장면 카피, 진행 표시와 엔딩을 조립합니다.
[`src/components/IntroAmbientVideo.tsx`](src/components/IntroAmbientVideo.tsx)는
기존 모바일 첫 진입 화면의 무음 자동재생 반복 영상을 별도로 제어합니다.
PC는 `DesktopCinematicWorld`에서 master 하나만 표시하며, 얼굴을 따로 합성한
이전 실험 영상이나 시간대가 다른 영상을 겹치지 않습니다.
엔딩 문구는 영상에 굽지 않고 HTML로
`학교를 더 똑똑하게` → `교사의 시간을 학생에게` → DOL AI LAB 로고 순서로
표시합니다. 마지막 로고 아래의 홈페이지 들어가기 버튼은 `#/about`으로 이동합니다.

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

- 두 상단 메뉴, 펼침 메뉴의 키보드·Escape·바깥 클릭 동작
- 첫 스크롤 소개·마지막 진입 버튼·홈페이지 바로가기·다시 보기와 모션 감소 경로
- 독립 화면 전환, 직접 주소, 새로고침, 뒤로·앞으로 가기
- 학생지원 10·학교안전 5·학교행정 8개 앱·기능의 필터·검색·6개씩 페이지 전환
- 앱 상세 창의 초점 유지·닫기·원래 버튼으로 복귀와 담당자 표시
- 영상이 없는 이미지 소개 화면·네 바로가기 카드·수상 전시·운영조직
- 접을 수 있는 드라코니스 소개 자료, 갤러리와 행정 업무 연결 제안
- 대표 이미지 크기와 드라코니스 자료 확대·원본 보기
- 1440px·900px·390px 반응형 및 가로 넘침
- 레거시 접근용 계정 문자열이 화면에 노출되지 않는지 여부
- 콘솔 오류, 페이지 오류, 실패한 네트워크 요청

결과와 스크린샷은 `artifacts/`에 저장됩니다.

```text
artifacts/
  browser-qa.json
  desktop-start.png
  desktop-app-menu.png
  desktop-app-overview.png
  desktop-student.png
  desktop-admin.png
  mobile-start.png
  mobile-app-menu.png
  mobile-student.png
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
- `src/hooks/useScrollVideo.ts`: 부분 영상 로드와 스크롤·영상 동기화
- `src/components/PosterStack.tsx`: 데스크톱·세로 포스터 선택과 원본 안정 구간
- `src/components/SceneOverlay.tsx`: 장면별 HTML 카피
- `src/components/IntroAmbientVideo.tsx`: 첫 화면 자동재생 반복 영상
- `src/components/EndSequence.tsx`: 고대비 HTML/SVG 엔딩 브랜드
- `src/components/ReducedMotionExperience.tsx`: 모션 감소 정적 여정
- `src/styles/global.css`: 브랜드 색상, 반응형 레이아웃, safe area와 접근성
- `src/data/labContent.ts`: 소개, 조직, 서비스, 수상, 세 영역과 23개 앱·기능의 검토된 데이터
- `src/App.tsx`: 선택한 화면만 마운트하고 화면 이동·브라우저 기록 처리
- `src/data/siteNavigation.ts`: 화면 주소와 기존 링크 호환
- `src/components/SiteHeader.tsx`: 두 메뉴와 세 항목씩 펼쳐지는 하위 메뉴
- `src/components/AboutWorkspace.tsx`: 이미지 배경 소개·수상·운영조직
- `src/components/AwardsShowcase.tsx`, `src/styles/awards-showcase.css`: 수상작 이미지·월계관·성과 수치를 강조한 전시 화면
- `src/components/AppWorkspace.tsx`: 세 영역·검색·페이지 전환·앱 상세 대화상자
- `src/styles/workspace-shell.css`: 공통 프레임·헤더·펼침 메뉴
- `src/styles/home-landing.css`: 홈페이지의 아이보리·초록 배경과 둥근 버튼·카드
- `src/styles/intro-experience.css`: 첫 소개의 헤더·진입 버튼과 반응형 엔딩
- `src/styles/draconis-showcase.css`: 드라코니스 자료 가독성과 확대 화면
- `src/styles/about-workspace.css`, `src/styles/app-workspace.css`: 각 화면의 반응형 디자인
- `src/utils/dialogFocus.ts`: 대화상자의 키보드 초점 순환
- `src/styles/content.css`: 보존된 공통 및 드라코니스 소개 자료 스타일
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
