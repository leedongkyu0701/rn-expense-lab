import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export type Expense = {
  id: number;
  amount: number;
};

type ExpensesContextValue = {
  expenses: Expense[];
  totalAmount: number;
  addExpense: (amount: number) => void;
  deleteExpense: (id: number) => void;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const nextId = useRef(1);
  const totalAmount = expenses.reduce((total, expense) => total + expense.amount, 0);

  function addExpense(amount: number) {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    if (!Number.isSafeInteger(nextId.current)) return;

    // ID는 이벤트에서 발급하고, 상태 갱신 함수는 순수하게 유지한다.
    const newExpense: Expense = { id: nextId.current, amount };
    nextId.current += 1;

    setExpenses((previous) => {
      const previousTotal = previous.reduce((total, expense) => total + expense.amount, 0);
      if (!Number.isSafeInteger(previousTotal + amount)) return previous;

      return [newExpense, ...previous];
    });
  }

  function deleteExpense(id: number) {
    setExpenses((previous) => previous.filter((expense) => expense.id !== id));
  }

  return (
    <ExpensesContext.Provider value={{ expenses, totalAmount, addExpense, deleteExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);

  if (context === null) {
    throw new Error("useExpenses는 ExpensesProvider 안에서 사용해야 합니다.");
  }

  return context;
}
