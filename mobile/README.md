# 지출 앱 — Expo SDK 58

앱 위치는 `mobile/`, 로컬 HTTP API는 `../server/`입니다.

설치·실행 명령, 기기별 API 주소, 캐시 정책, 핵심 코드 읽는 순서와 검증 방법은 [저장소 README](../README.md)를 확인하세요.

```bash
npm ci
cp .env.example .env
# 실행 기기에 맞게 EXPO_PUBLIC_API_URL 수정
npm start
```

API 서버도 별도 터미널에서 실행하세요.

```bash
cd ../server
npm ci
npm run dev
```
