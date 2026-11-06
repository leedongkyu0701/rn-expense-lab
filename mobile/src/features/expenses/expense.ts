export type Expense = { id: number; amount: number };

export function isExpense(value: unknown): value is Expense {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    Number.isSafeInteger(value.id) && value.id > 0 &&
    "amount" in value && typeof value.amount === "number" &&
    Number.isSafeInteger(value.amount) && value.amount > 0;
}

export function totalExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}
