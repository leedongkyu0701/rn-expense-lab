# RN Expense Lab — HTTP API와 TanStack Query

기존 목록·설정 탭, 상세 화면, 등록 모달을 유지하는 학습용 앱입니다. Expo SDK 58, React Native 0.88.1, React 19.3, TypeScript, TanStack Query v5를 사용합니다.

## 실행

Node.js **24 이상**과 npm이 필요합니다. 서버는 Node의 TypeScript 직접 실행 기능을 사용합니다. 루트에서 터미널 두 개를 열어 실행하세요.

```bash
# 터미널 1: API 서버
cd server
npm ci
npm run dev
```

```bash
# 터미널 2: Expo
cd mobile
npm ci
cp .env.example .env
# 실행 기기에 맞게 .env의 EXPO_PUBLIC_API_URL 수정
npm start
```

서버를 감시 모드 없이 실행하려면 `server/`에서 `npm start`를 사용합니다. Expo 터미널의 `i`는 iOS 시뮬레이터, `a`는 Android 에뮬레이터입니다. 휴대폰은 SDK 58을 지원하는 Expo Go 또는 개발 빌드로 QR 코드를 여세요.

| 실행 환경 | `mobile/.env` 예시 |
| --- | --- |
| 실제 iPhone / Android | `EXPO_PUBLIC_API_URL=http://192.168.0.10:3001` (개발 PC의 실제 LAN IP로 변경) |
| 같은 Mac의 iOS 시뮬레이터 | `EXPO_PUBLIC_API_URL=http://localhost:3001` |
| Android Studio 기본 에뮬레이터 | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3001` |
| 개발 PC 웹 브라우저 | `EXPO_PUBLIC_API_URL=http://localhost:3001` |

`localhost`는 요청을 실행하는 기기 자신입니다. 휴대폰의 localhost는 휴대폰이므로 PC의 서버에 연결되지 않습니다. iOS 시뮬레이터는 Mac의 localhost에 접근할 수 있습니다. Android 에뮬레이터는 별도 가상 네트워크를 사용하며 `10.0.2.2`로 호스트 PC의 루프백에 접근합니다.

실제 휴대폰 연결 순서:

1. PC 네트워크 설정에서 LAN IPv4 주소를 확인하고 PC·휴대폰을 같은 Wi-Fi에 연결합니다.
2. `.env`에 `http://PC의_IP:3001`을 넣습니다. 기본 서버 바인딩은 `0.0.0.0:3001`입니다. `0.0.0.0`은 모든 인터페이스에서 수신한다는 뜻이며 앱의 목적지 주소가 아닙니다. `HOST=127.0.0.1`로 실행하면 실제 휴대폰에서 접근할 수 없습니다.
3. PC 브라우저에서 `http://localhost:3001/expenses`, 휴대폰 브라우저에서 `http://PC의_IP:3001/expenses`를 열어 JSON이 나오는지 확인합니다.
4. 연결되지 않으면 서버 로그·IP·3001 포트 방화벽 수신 허용·공유기의 기기 간 통신 차단(게스트 Wi-Fi)·VPN을 확인합니다. Expo Metro 연결과 API 연결은 별개이며 Expo 터널이 로컬 API까지 공개하지는 않습니다.

서버의 선택적 환경변수는 `HOST`, `PORT`, `DATA_FILE`입니다. 예: `HOST=0.0.0.0 PORT=3001 npm start`.
`EXPO_PUBLIC_` 값은 앱 번들에 포함되는 **공개 설정**입니다. 비밀키를 넣지 마세요. `.env` 변경 후 앱을 완전히 Reload하고 필요하면 Expo 개발 서버도 다시 실행하세요. `.env`는 Git에서 제외하고 예시만 추적합니다.

## API와 저장

지출은 `{ id: number; amount: number }`입니다. 서버가 ID를 증가시키며 삭제해도 재사용하지 않습니다. 목록은 최근 생성 순(ID 내림차순)입니다.

| 요청 | 성공 응답 | 오류 예시 |
| --- | --- | --- |
| `GET /expenses` | `200`, `Expense[]` | 서버 오류 `500` |
| `GET /expenses/:id` | `200`, `Expense` | 잘못된 ID `400`, 없는 ID `404` |
| `POST /expenses` | `201`, 생성된 `Expense`, `Location` 헤더 | 금액/JSON 오류 `400`, 합계/ID 한계 `409` |
| `DELETE /expenses/:id` | `204`, 본문 없음 | 잘못된 ID `400`, 없는 ID `404` |

POST는 `Content-Type: application/json`, 본문 `{ "amount": 12000 }`을 사용합니다. 금액은 양의 안전한 정수, 합계는 `Number.MAX_SAFE_INTEGER` 이하여야 합니다. 서버가 최신 데이터로 최종 검증하므로 동시 등록에도 제한이 유지됩니다. 오류 응답은 `{ "message": "설명" }`입니다. 미지원 메서드는 `405`, Content-Type 오류는 `415`, 4 KiB를 넘는 본문은 `413`입니다.

```bash
curl http://localhost:3001/expenses
curl -i -X POST http://localhost:3001/expenses \
  -H 'Content-Type: application/json' -d '{"amount":12000}'
# 생성 응답의 ID로 변경하세요.
curl -i http://localhost:3001/expenses/1
curl -i -X DELETE http://localhost:3001/expenses/1
curl -i -X POST http://localhost:3001/expenses \
  -H 'Content-Type: application/json' -d '{"amount":0}'
curl -i http://localhost:3001/expenses/999999
```

이 API는 **로컬 학습용**입니다. 인증이 없고 Expo web 실습을 위해 CORS를 허용합니다. 공용 인터넷이나 운영 서비스에 배포하는 구성이 아닙니다.

기본 파일 `server/data/expenses.json`에 지출·다음 ID를 저장하며 Git에서 제외합니다. 변경의 읽기·검증·임시 파일 쓰기·rename·메모리 반영 전체를 Promise 큐로 직렬화합니다. 파일 저장 성공 후에만 HTTP 성공을 반환하고, 실패한 작업은 다음 요청을 막지 않습니다. 서버 재시작 시 파일을 검증·복원하며 손상된 원본을 덮어쓰지 않습니다. **단일 서버 프로세스용이며 여러 프로세스가 같은 파일을 공유하는 방식은 지원하지 않습니다.**

이전 AsyncStorage 키 `@rn-expense-lab/expenses/v1`는 읽거나 삭제하거나 자동 업로드하지 않고 보존합니다. 이번 버전은 서버 데이터를 새로 사용하며 **기존 기기 기록의 이전은 포함하지 않습니다.** 사용하지 않는 Context·복원 화면·저장 상태 UI·저장 모듈과 AsyncStorage 의존성은 제거했습니다. 이전 구현은 Git 이력에서 확인할 수 있습니다.

## 파일 역할과 읽는 순서

| 순서 | 파일 | 역할 |
| --- | --- | --- |
| 1 | `mobile/src/features/expenses/expense.ts` | 독립적인 Expense 타입·응답 검증·합계 계산 |
| 2 | `server/src/store.ts` | 서버 ID·금액/합계 제한·파일 복원·변경 직렬화 |
| 3 | `server/src/app.ts`, `server/src/index.ts` | HTTP 경로·상태 코드·서버 실행/주소 설정 |
| 4 | `mobile/src/lib/api.ts` | 환경변수·fetch·HTTP/연결 오류·204 처리 |
| 5 | `mobile/src/features/expenses/expenses-api.ts` | 목록·상세·등록·삭제 요청 함수와 응답 검증 |
| 6 | `mobile/src/features/expenses/expenses-queries.ts` | queryKey·조회/변경 훅·캐시 정책 |
| 7 | `mobile/src/lib/query-provider.tsx`, `mobile/src/app/_layout.tsx` | 안정적인 QueryClient·AppState·루트 Provider |
| 8 | `mobile/src/app/(tabs)/index.tsx` | 목록 상태·건수/합계·새로고침·삭제 |
| 9 | `mobile/src/app/expenses/[id].tsx` | 경로 검증·직접 상세 조회·로딩/오류/404 |
| 10 | `mobile/src/app/expenses/new.tsx` | 입력 useState·금액 검증·비동기 제출 잠금·성공 후 닫기 |
| 11 | `mobile/src/app/(tabs)/settings.tsx` | 서버 저장 방식에 맞춘 소개 |
| 12 | `server/src/app.test.ts` | 실제 HTTP·임시 파일로 API 계약/동시성/복원 검증 |

각 `package.json`·`package-lock.json`에 의존성과 명령을 추가했습니다. 서버 검사 설정은 `server/tsconfig.json`·`server/eslint.config.js`, 주소 예시는 `mobile/.env.example`입니다. 각 `.gitignore`는 로컬 설정·서버 데이터·의존성을 제외합니다. `mobile/README.md`는 이 문서로 안내합니다.

## 데이터 흐름과 캐시 정책

1. 목록의 `useExpensesQuery()`가 `['expenses', 'list']`를 구독합니다. 캐시가 없으면 `getExpenses(signal)` → 공통 fetch → `GET /expenses` 결과를 Query 캐시에 넣습니다. 조회의 AbortSignal을 fetch까지 전달합니다.
2. 화면은 `query.data`에서 건수·합계를 계산합니다. 최초 로딩·오류와 재시도·정상적인 빈 목록을 구분합니다. 재조회 중/실패 시에도 기존 데이터를 유지합니다. 당겨서 새로고침은 명시적으로 `refetch()`합니다.
3. 등록의 문자열 입력만 화면 `useState`에 둡니다. 알고 있는 합계로 미리 검증하며 서버가 최신 합계·ID 범위를 최종 검증합니다. 목록을 아직 못 받아도 서버에 등록을 요청할 수 있습니다.
4. 저장 시 ref 잠금으로 렌더 사이의 연속 탭도 막고 `mutateAsync(amount)` → `POST /expenses`를 실행합니다. 진행 중 저장·입력·취소 버튼을 비활성화합니다. 실패하면 입력을 유지하고 잠금을 풀어 재시도할 수 있습니다.
5. 성공 후 진행 중인 이전 목록 조회를 취소하고 서버가 반환한 지출을 기존 목록 캐시에 반영합니다. 해당 상세 캐시도 채웁니다. 목록을 invalidate하여 서버와 다시 맞춘 뒤 모달을 닫습니다. 캐시가 없을 때 단일 지출을 전체 목록으로 취급하지 않습니다.
6. 삭제도 서버 성공 후에만 목록에서 제거합니다. 이전 목록/해당 상세 조회를 취소하고 관련 상세 캐시를 제거한 뒤 목록을 invalidate합니다. 실패하면 항목을 유지하고 안내합니다. 삭제는 한 번에 하나만 실행합니다.

`staleTime`은 **30초**입니다. 무효화는 30초가 지나지 않아도 stale로 바꾸고 구독 중인 목록을 재조회합니다. 새 마운트·앱 활성화는 stale인 경우에 갱신합니다. 화면 진입마다 강제 refetch하지 않습니다. 내비게이션 스택에 남은 화면은 탭 전환만으로 다시 마운트되지 않을 수 있습니다. 즉시 갱신하려면 당겨서 새로고침하세요.

조회와 mutation 자동 재시도는 껐습니다. 특히 POST는 저장 후 응답만 유실될 수 있어 자동 재전송하지 않습니다. 수동 재시도까지 정확히 한 번임을 보장하는 멱등성 키는 이번 범위에 없으므로, 연결 오류 후에는 목록을 확인하고 다시 등록하세요.

상세 `['expenses', 'detail', id]`는 목록과 독립적으로 조회해 직접 진입도 가능합니다. 배열·음수·소수·지수 표기·안전하지 않은 ID는 화면에서 거르고 `skipToken`으로 요청 자체를 비활성화합니다. 404와 연결/서버 오류를 구분합니다.

## Context·AsyncStorage의 역할 변화

| 이전 | 현재 |
| --- | --- |
| Context 배열이 원본 | 서버 파일이 원본, Query가 서버 데이터의 메모리 캐시 |
| 기기에서 ID 생성·합계 제한 | 서버 ID 생성·최종 제한, 화면은 사전 입력 검증 |
| Provider 저장/복원으로 앱 전체 대기 | 각 화면이 조회 로딩/오류 처리, 루트는 즉시 내비게이터 렌더 |
| AsyncStorage 영속화 | 서버 파일 영속화, 앱 재시작 시 새 조회 |
| 기기 저장 상태 UI | HTTP pending/error UI |

QueryClient는 Provider의 `useState(() => new QueryClient(...))`로 생성해 리렌더 시 유지합니다. 같은 서버 데이터를 Context·화면 useState·AsyncStorage에 복제하지 않습니다.

## 웹 공통 개념과 RN에서 추가한 개념

웹 React와 queryKey·useQuery/useMutation·AbortSignal·HTTP 상태·staleTime·invalidate 개념은 같습니다. Next.js 서버 컴포넌트처럼 앱 안에서 API 서버를 실행하지 않습니다. 모바일 JS는 설치된 앱에서 실행되고 PC 서버에 네트워크로 접근합니다.

**화면 focus**는 내비게이션에서 현재 화면이 바뀌는 것이고, **앱 활성 상태**는 홈/다른 앱에서 이 앱으로 돌아오는 OS 상태입니다. 목록→상세 이동 중에도 앱은 active입니다. 루트에서 AppState change를 한 번 구독해 `focusManager.setFocused(status === 'active')`와 연결합니다. 활성 복귀 시 구독 중인 stale 조회가 갱신됩니다. effect 정리 시 구독을 제거하고 focus 설정을 되돌립니다. 웹에서는 이 구독을 생략해 Query의 브라우저 focus 처리를 사용합니다.

RN에서는 HTML 대신 `TextInput`·`Pressable`·`FlatList`를 사용합니다. `refreshing`을 Query 재조회 상태와 연결했습니다. 기존 숫자 키보드·KeyboardAvoidingView의 헤더 높이 보정·keyboardShouldPersistTaps·Keyboard.dismiss·Expo Router 모달 구조를 유지했습니다. 숫자 키보드여도 잘못된 입력 가능성이 있어 문자열과 숫자를 검증합니다.

## 검증과 직접 확인

```bash
cd mobile
npm run lint
npm run type-check
```

```bash
cd server
npm run lint
npm run type-check
npm test
```

API 테스트는 임시 디렉터리·임의 루프백 포트를 사용하며 실제 학습 데이터 파일을 변경하지 않습니다. 조회·생성·직접 상세·204 삭제·입력 오류·404·최신순·동시 생성/삭제·합계 한계·ID 고갈·파일 복원·손상 원본 보존을 검사합니다.

직접 확인할 동작:

- 빈 목록 → 등록 → 모달 종료 → 건수/합계·상세 확인.
- 저장/삭제 연속 탭 시 중복 방지·진행 문구 확인.
- 서버를 끄고 새로고침/삭제/등록해 오류·항목/입력 유지 확인 후 서버를 켜고 재시도.
- 당겨서 새로고침, 30초 후 다른 앱에서 돌아와 stale 데이터 갱신 확인.
- 상세 경로 직접 진입, 잘못된 ID와 없는 ID의 다른 안내 확인.
- 서버 재시작 후 기록 유지와 기존 기기 기록의 자동 이전이 없는 것 확인.

모바일/서버 lint·TypeScript 검사와 API 통합 테스트를 실행했습니다. **실제 휴대폰·iOS 시뮬레이터·Android 에뮬레이터에서 UI·키보드·LAN·AppState 전환은 실행 검증하지 않았습니다.**

## 확인한 공식 문서

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [환경변수](https://docs.expo.dev/guides/environment-variables/)
- [TanStack Query RN 연동](https://tanstack.com/query/latest/docs/framework/react/react-native), [조회 취소](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [RN 0.88.1 AppState](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/AppState/AppState.js), [FlatList](https://github.com/facebook/react-native/blob/v0.88.1/packages/react-native/Libraries/Lists/FlatList.js)
