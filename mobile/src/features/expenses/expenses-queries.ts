import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Expense } from "./expense";
import { createExpense, deleteExpense, getExpense, getExpenses } from "./expenses-api";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: () => [...expenseKeys.all, "list"] as const,
  detail: (id: number | null) => [...expenseKeys.all, "detail", id] as const,
};

export function useExpensesQuery() {
  return useQuery({
    queryKey: expenseKeys.list(),
    queryFn: ({ signal }) => getExpenses(signal),
  });
}

export function useExpenseQuery(id: number | null) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    // 잘못된 경로 파라미터는 refetch를 호출해도 요청할 수 없다.
    queryFn: id === null ? skipToken : ({ signal }) => getExpense(id, signal),
  });
}

export function useCreateExpense() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    retry: false,
    onSuccess: async (expense) => {
      // 이미 진행 중이던 이전 조회가 성공 결과를 덮어쓰지 않도록 취소한다.
      await client.cancelQueries({ queryKey: expenseKeys.list(), exact: true });
      client.setQueryData(expenseKeys.detail(expense.id), expense);
      client.setQueryData<Expense[]>(expenseKeys.list(), (previous) => previous
        ? [expense, ...previous.filter((item) => item.id !== expense.id)].sort((a, b) => b.id - a.id)
        : undefined);
      await client.invalidateQueries({ queryKey: expenseKeys.list(), exact: true });
    },
  });
}

export function useDeleteExpense() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    retry: false,
    onSuccess: async (_, id) => {
      await Promise.all([
        client.cancelQueries({ queryKey: expenseKeys.list(), exact: true }),
        client.cancelQueries({ queryKey: expenseKeys.detail(id), exact: true }),
      ]);
      client.setQueryData<Expense[]>(expenseKeys.list(), (previous) => previous?.filter((item) => item.id !== id));
      client.removeQueries({ queryKey: expenseKeys.detail(id), exact: true });
      await client.invalidateQueries({ queryKey: expenseKeys.list(), exact: true });
    },
  });
}
