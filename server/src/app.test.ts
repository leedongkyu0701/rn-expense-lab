import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";

import { createExpenseServer } from "./app.ts";
import { ExpenseStore, type Expense } from "./store.ts";

async function fixture(t: TestContext, initial?: unknown) {
  const directory = await mkdtemp(join(tmpdir(), "expense-api-"));
  const file = join(directory, "expenses.json");
  t.after(() => rm(directory, { recursive: true, force: true }));
  if (initial !== undefined) await writeFile(file, JSON.stringify(initial));
  const server = createExpenseServer(await ExpenseStore.open(file));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const address = server.address();
  assert(address && typeof address !== "string");
  const request = (path = "/expenses", init?: RequestInit) =>
    fetch(`http://127.0.0.1:${address.port}${path}`, init);
  const post = (amount: unknown) => request("/expenses", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }),
  });
  return { request, post, file };
}

test("HTTP 목록·생성·직접 상세·삭제 및 서버 저장 복원", async (t) => {
  const { request, post, file } = await fixture(t);
  assert.deepEqual(await (await request()).json(), []);
  const firstResponse = await post(12000);
  assert.equal(firstResponse.status, 201);
  assert.equal(firstResponse.headers.get("location"), "/expenses/1");
  const first = await firstResponse.json();
  assert.deepEqual(first, { id: 1, amount: 12000 });
  const second = await (await post(3000)).json();
  assert.deepEqual(await (await request()).json(), [second, first]);
  assert.deepEqual(await (await request("/expenses/1")).json(), first);
  assert.deepEqual((await ExpenseStore.open(file)).list(), [second, first]);

  const deleted = await request("/expenses/2", { method: "DELETE" });
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), "");
  assert.equal((await request("/expenses/2")).status, 404);
  assert.equal((await request("/expenses/2", { method: "DELETE" })).status, 404);
  const reopened = await ExpenseStore.open(file);
  assert.deepEqual(reopened.list(), [first]);
  // 삭제된 최대 ID도 재실행 후 재사용하지 않는다.
  assert.deepEqual(await reopened.create(500), { id: 3, amount: 500 });
});

test("잘못된 금액·JSON·ID·경로·메서드를 HTTP 오류로 구분", async (t) => {
  const { request, post } = await fixture(t);
  for (const amount of [0, -1, 1.5, "1000", null, Number.MAX_SAFE_INTEGER + 1]) {
    const response = await post(amount);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).message, "string");
  }
  for (const body of ["{", "{}", "[]", "null"]) {
    assert.equal((await request("/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
    })).status, 400);
  }
  assert.equal((await request("/expenses", { method: "POST", body: "hello" })).status, 415);
  assert.equal((await request("/expenses", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: "1".repeat(5000) }),
  })).status, 413);
  for (const id of ["0", "-1", "1.5", "1e2", "01", "9007199254740992", "abc"]) {
    assert.equal((await request(`/expenses/${id}`)).status, 400);
  }
  assert.equal((await request("/expenses/999")).status, 404);
  assert.equal((await request("/missing")).status, 404);
  assert.equal((await request("/expenses", { method: "PATCH" })).status, 405);
  // 검증 실패가 변경 큐를 막지 않는다.
  assert.equal((await post(100)).status, 201);
});

test("동시 생성·삭제의 ID·목록·파일에 유실이 없다", async (t) => {
  const { request, post, file } = await fixture(t);
  const created: Expense[] = await Promise.all(Array.from({ length: 20 }, async () => {
    const response = await post(10);
    assert.equal(response.status, 201);
    return response.json();
  }));
  assert.equal(new Set(created.map((item) => item.id)).size, 20);
  await Promise.all([
    ...Array.from({ length: 10 }, (_, index) => request(`/expenses/${index + 1}`, { method: "DELETE" })),
    ...Array.from({ length: 10 }, () => post(20)),
  ].map(async (pending) => assert.ok((await pending).ok)));
  const expenses: Expense[] = await (await request()).json();
  assert.deepEqual(expenses.map((item) => item.id), Array.from({ length: 20 }, (_, index) => 30 - index));
  assert.equal(expenses.reduce((sum, item) => sum + item.amount, 0), 300);
  assert.deepEqual((await ExpenseStore.open(file)).list(), expenses);
});

test("동시 요청에서도 합계 안전 정수 제한 유지", async (t) => {
  const { post, request } = await fixture(t);
  assert.equal((await post(Number.MAX_SAFE_INTEGER - 1)).status, 201);
  const results = await Promise.all([post(1), post(1)]);
  assert.deepEqual(results.map((response) => response.status).sort(), [201, 409]);
  const expenses: Expense[] = await (await request()).json();
  assert.equal(expenses.reduce((sum, item) => sum + item.amount, 0), Number.MAX_SAFE_INTEGER);
});

test("최대 ID 이후 생성 차단 및 재실행 후 고갈 상태 유지", async (t) => {
  const { post, request, file } = await fixture(t, { nextId: Number.MAX_SAFE_INTEGER, expenses: [] });
  assert.equal((await post(1)).status, 201);
  assert.equal((await post(1)).status, 409);
  assert.equal((await request(`/expenses/${Number.MAX_SAFE_INTEGER}`, { method: "DELETE" })).status, 204);
  const reopened = await ExpenseStore.open(file);
  await assert.rejects(reopened.create(1), { status: 409 });
});

test("손상된 저장 파일은 초기화하거나 덮어쓰지 않는다", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "expense-corrupt-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, "expenses.json");
  for (const contents of ["broken", JSON.stringify({ nextId: 1, expenses: [{ id: 1, amount: -1 }] })]) {
    await writeFile(file, contents);
    await assert.rejects(ExpenseStore.open(file));
    assert.equal(await readFile(file, "utf8"), contents);
  }
});
