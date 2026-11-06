export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getApiUrl() {
  // Expo는 정적인 점 표기법을 앱 번들에 치환한다.
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) {
    throw new Error("API 주소가 없습니다. mobile/.env에 EXPO_PUBLIC_API_URL을 설정하고 앱을 다시 로드해주세요.");
  }
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.search || url.hash) throw new Error();
    return value.replace(/\/+$/, "");
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL에 http:// 또는 https://로 시작하는 API 주소를 설정해주세요.");
  }
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${getApiUrl()}${path}`;
  let response: Response;
  let body: string;
  try {
    response = await fetch(url, options);
    body = await response.text();
  } catch (error) {
    // 취소는 연결 실패로 바꾸지 않아야 Query가 정상적으로 취소를 처리한다.
    if (options.signal?.aborted) throw error;
    throw new Error("API 서버에 연결하지 못했습니다. 서버 실행 여부, API 주소, 같은 Wi-Fi와 방화벽을 확인해주세요.");
  }

  if (!response.ok) {
    let message = `요청에 실패했습니다. (HTTP ${response.status})`;
    try {
      const data: unknown = JSON.parse(body);
      if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
        message = data.message;
      }
    } catch { /* JSON이 아닌 오류 응답은 HTTP 상태로 안내한다. */ }
    throw new ApiError(response.status, message);
  }

  // DELETE 204에는 JSON 본문이 없다.
  if (response.status === 204 || !body.trim()) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("서버 응답이 올바른 JSON 형식이 아닙니다.");
  }
}
