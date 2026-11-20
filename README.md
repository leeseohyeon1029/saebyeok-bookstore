# 진로 아카이브

고2 학생을 위한 진로 정보 아카이브 웹앱 (하남드리머즈 학습 멘토링).
학과·직업·대학 수업 사례·영상을 출처와 함께 둘러보고, 스크랩·메모·관심 직업 정리를 쌓아 가는 자료실이다.

- 배포 주소: https://leeseohyeon1029.github.io/saebyeok-bookstore/
- 프로젝트 지침: [CLAUDE.md](CLAUDE.md) · 기능 명세: [docs/SPEC.md](docs/SPEC.md)

## 실행

```bash
npm install
cp .env.example .env   # Firebase 설정값과 멘토 비밀번호 입력
npm run dev
```

`.env`에 Firebase 설정이 없으면 **개발 모드**로 동작한다. 기록이 그 기기 브라우저에만 저장되고, 화면 맨 위에 안내 띠가 보인다.

| 명령 | 하는 일 |
| --- | --- |
| `npm run validate` | `data/content.json` 검사 |
| `npm run build` | 검사 → 타입 검사 → 빌드 (`dist/`) |
| `npm run lint` | ESLint |

## 배포 (GitHub Pages)

`main`에 push하면 `.github/workflows/deploy.yml`이 검사·빌드 후 자동 배포한다. 처음 한 번만 설정한다.

1. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꾼다.
2. **Settings → Secrets and variables → Actions → New repository secret**에 아래 값을 하나씩 넣는다.
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_MENTOR_PASSWORD`
3. Firebase 콘솔에서 **Authentication → 로그인 방법 → 익명** 사용 설정, **Firestore Database** 만들기, **규칙** 탭에 `firestore.rules` 내용을 붙여 넣고 게시한다.
4. Firebase **Authentication → 설정 → 승인된 도메인**에 `leeseohyeon1029.github.io`를 추가한다.

### 주소(저장소 이름)를 바꿀 때
1. GitHub에서 저장소 이름을 바꾼다.
2. `vite.config.ts`의 `BASE_PATH`를 `'/새-이름/'`으로 바꾼다.
3. `CLAUDE.md`와 이 README의 주소를 고친다.

화면 주소는 `#/archive`처럼 `#`이 붙는다. GitHub Pages에서 새로고침해도 화면이 깨지지 않게 하기 위해서다.

## 콘텐츠 추가 방법

모든 내용은 `data/content.json`에서만 읽는다. 컴포넌트에 내용을 쓰지 않는다.

1. `items` 배열에 항목을 추가한다. **`sources`가 1개 이상 없으면 화면에 나오지 않는다.** 출처 없는 내용은 넣지 않는다.
2. `npm run validate`로 검사한다. 통과해야 빌드·배포된다.
3. 목록의 "추천순"은 `items`에 적힌 순서다. 먼저 보여 주고 싶은 항목을 앞에 둔다.

### 공통 필드

| 필드 | 설명 |
| --- | --- |
| `id` | 고유 id. 관례: 학과 `m-`, 직업 `j-`, 사례 `c-`, 영상 `v-`, 자료 `r-` |
| `type` | `major` 학과 · `job` 직업 · `case` 수업·직무 사례 · `video` 영상 · `resource` 진로 정보 사이트 |
| `title` | 제목 |
| `fields` | 계열 id 배열. 최상위 `fields`에 정의된 것만 (`language`, `chinese`, `business`, `economics`, `social`, `humanities`, `education`) |
| `summary` | 한 줄 요약 |
| `points` | 핵심 포인트 문장 배열 (없으면 `[]`) |
| `lookFor` | "보면서 찾을 것" 질문 1개 |
| `sources` | `[{ "label": "출처 이름", "url": "https://..." }]` 1개 이상 |
| `related` | 관련 항목 id 배열. 존재하는 id만 (없으면 `[]`) |
| `tags` | 검색용 태그 (없으면 `[]`) |

### 유형별 필드

| 유형 | 필드 |
| --- | --- |
| `major` | `courses` 배우는 과목 배열, `careers` 졸업 후 진출 배열 (둘 다 필수) |
| `job` | `group` 직업 묶음 이름, `path` 되는 길 (둘 다 필수) |
| `video` | `source` 채널 이름 (필수), `episode` 회차 (선택). 영상은 `sources`의 YouTube 링크로만 연결하고 앱에 넣지 않는다 |

## 사용자 데이터 (Firestore)

`users/{닉네임_숫자}` 문서와 하위 컬렉션 `scraps`, `notes`, `reactions`, `views`, `jobCards`, `planB`. 자세한 구조는 SPEC 6장.

> 멘토 비밀번호는 빌드 결과(JS 파일)에 들어간다. 사용자 1~2명·개인정보 없음 전제의 가벼운 잠금이니, 다른 곳에서 쓰는 비밀번호는 쓰지 않는다.
