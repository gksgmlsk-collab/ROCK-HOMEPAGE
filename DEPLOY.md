# GitHub · Render 배포 안내

이 프로젝트는 Vite 정적 사이트입니다. Render에서는 **Static Site**로 배포하며,
루트의 `render.yaml`을 사용하면 빌드 명령과 SPA 경로 처리가 자동으로 설정됩니다.

## 1. 로컬 최종 확인

PowerShell에서 프로젝트 폴더로 이동한 뒤 실행합니다.

```powershell
cd "C:\path\to\homepage"
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 2. GitHub 연결 상태

현재 프로젝트는 아래 공개 저장소의 `main` 브랜치에 연결되어 있습니다.

- 저장소: `https://github.com/gksgmlsk-collab/ROCK-HOMEPAGE`
- 원격 이름: `origin`
- 브랜치: `main`

다른 컴퓨터에서 처음 내려받을 때:

```powershell
git clone https://github.com/gksgmlsk-collab/ROCK-HOMEPAGE.git
cd ROCK-HOMEPAGE
npm ci
```

현재 프로젝트 폴더에서 원격 연결을 다시 확인할 때:

```powershell
git remote -v
git status
```

## 3. Render에 연결

1. Render Dashboard에서 **New > Blueprint**를 선택합니다.
2. `gksgmlsk-collab/ROCK-HOMEPAGE` 저장소를 연결합니다.
3. 저장소 루트의 `render.yaml`을 확인한 뒤 Blueprint를 적용합니다.
4. 생성된 `onrender.com` 주소에서 홈페이지를 확인합니다.

Blueprint 대신 **New > Static Site**로 직접 만들 때의 값은 다음과 같습니다.

- Branch: `main`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Auto-Deploy: `On Commit`

이후 수정 배포는 아래 세 줄이면 됩니다.

```powershell
git add .
git commit -m "Update DOL AI LAB website"
git push
```

## 비용 관련

- 별도 서버가 없는 정적 사이트이므로 Render의 Static Site 유형을 사용합니다.
- `pullRequestPreviewsEnabled: false`로 설정해 불필요한 미리보기 빌드를 만들지
  않습니다.
- 영상 생성 명령은 Render 빌드에 포함되지 않습니다. 배포 중 Higgsfield나
  Seedance가 실행되거나 비용이 발생하지 않습니다.
- Render Hobby의 포함 대역폭을 넘었을 때 자동 결제를 원하지 않으면 결제수단을
  등록하지 말고 Dashboard의 Billing과 서비스 Metrics에서 사용량을 확인합니다.
  결제수단이 없으면 한도 초과 시 과금 대신 해당 월의 서비스가 중지됩니다.
