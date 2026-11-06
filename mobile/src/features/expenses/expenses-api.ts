import { apiRequest } from "@/lib/api";

import { isExpense, totalExpenses, type Expense } from "./expense";

function parseExpense(data: unknown): Expense {
  if (!isExpense(data)) throw new Error("서버에서 올바르지 않은 지출 데이터를 받았습니다.");
  return data;
}

export async function getExpenses(signal: AbortSignal): Promise<Expense[]> {
  const data = await apiRequest("/expenses", { signal });
  if (!Array.isArray(data) || !data.every(isExpense) ||
      new Set(data.map((item) => item.id)).size !== data.length ||
      !Number.isSafeInteger(totalExpenses(data))) {
    throw new Error("서버에서 올바르지 않은 지출 목록을 받았습니다.");
  }
  return data;
}

export async function getExpense(id: number, signal: AbortSignal): Promise<Expense> {
  const expense = parseExpense(await apiRequest(`/expenses/${id}`, { signal }));
  if (expense.id !== id) throw new Error("요청한 ID와 서버 지출 ID가 다릅니다.");
  return expense;
}

export async function createExpense(amount: number): Promise<Expense> {
  return parseExpense(await apiRequest("/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  }));
}

export async function deleteExpense(id: number): Promise<void> {
  await apiRequest(`/expenses/${id}`, { method: "DELETE" });
}
