import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Expense } from "./expenses-context";

const STORAGE_KEY = "@rn-expense-lab/expenses/v1";

export class InvalidExpensesDataError extends Error {}

function parseExpenses(json: string): Expense[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new InvalidExpensesDataError("지출 데이터가 올바른 JSON이 아닙니다.");
  }
  if (!Array.isArray(data)) {
    throw new InvalidExpensesDataError("지출 데이터가 배열이 아닙니다.");
  }

  const ids = new Set<number>();
  let total = 0;
  return data.map((item: unknown) => {
    if (typeof item !== "object" || item === null ||
        !("id" in item) || !("amount" in item) ||
        typeof item.id !== "number" || typeof item.amount !== "number" ||
        !Number.isSafeInteger(item.id) || item.id <= 0 ||
        !Number.isSafeInteger(item.amount) || item.amount <= 0 ||
        ids.has(item.id)) {
      throw new InvalidExpensesDataError("지출 ID 또는 금액이 올바르지 않습니다.");
    }
    ids.add(item.id);
    total += item.amount;
    if (!Number.isSafeInteger(total)) {
      throw new InvalidExpensesDataError("지출 합계가 안전한 정수 범위를 초과합니다.");
    }
    return { id: item.id, amount: item.amount };
  });
}

// 쓰기를 직렬화한다. 실패한 작업도 다음 저장을 막지 않는다.
let pendingWrite: Promise<void> = Promise.resolve();

export async function loadExpenses(): Promise<Expense[]> {
  await pendingWrite;
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json === null ? [] : parseExpenses(json);
}

export function saveExpenses(expenses: Expense[]): Promise<void> {
  const json = JSON.stringify(expenses);
  const write = pendingWrite.then(() => AsyncStorage.setItem(STORAGE_KEY, json));
  pendingWrite = write.catch(() => {});
  return write;
}
