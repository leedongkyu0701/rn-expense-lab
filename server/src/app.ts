import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { ExpenseStore, HttpError } from "./store.ts";

function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function readAmount(request: IncomingMessage): Promise<unknown> {
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") {
    throw new HttpError(415, "Content-Type은 application/json이어야 합니다.");
  }
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) throw new HttpError(413, "요청 본문이 너무 큽니다.");
    chunks.push(chunk);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "올바른 JSON 본문을 보내주세요.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body) || !("amount" in body)) {
    throw new HttpError(400, "요청 본문에 amount가 필요합니다.");
  }
  return body.amount;
}

export function createExpenseServer(store: ExpenseStore) {
  return createServer(async (request, response) => {
    // Expo web에서도 실습할 수 있게 허용. 인증 없는 로컬 학습 서버 전용이다.
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Cache-Control", "no-store");
    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204).end();
        return;
      }
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      const detail = /^\/expenses\/([^/]+)$/.exec(path);
      if (path !== "/expenses" && !detail) throw new HttpError(404, "API 경로를 찾을 수 없습니다.");
      if (detail) {
        const id = Number(detail[1]);
        if (!/^[1-9]\d*$/.test(detail[1]) || !Number.isSafeInteger(id)) {
          throw new HttpError(400, "올바른 지출 ID가 필요합니다.");
        }
        if (request.method === "GET") {
          json(response, 200, store.get(id));
          return;
        }
        if (request.method === "DELETE") {
          await store.delete(id);
          response.writeHead(204).end();
          return;
        }
      } else {
        if (request.method === "GET") {
          json(response, 200, store.list());
          return;
        }
        if (request.method === "POST") {
          const expense = await store.create(await readAmount(request));
          response.setHeader("Location", `/expenses/${expense.id}`);
          json(response, 201, expense);
          return;
        }
      }
      response.setHeader("Allow", detail ? "GET, DELETE, OPTIONS" : "GET, POST, OPTIONS");
      throw new HttpError(405, "지원하지 않는 HTTP 메서드입니다.");
    } catch (error) {
      if (error instanceof HttpError) {
        json(response, error.status, { message: error.message });
      } else {
        console.error(error);
        json(response, 500, { message: "서버에서 요청을 처리하지 못했습니다." });
      }
    }
  });
}
