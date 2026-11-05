import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { ExpensesRestoreScreen } from "./expenses-restore-screen";
import { InvalidExpensesDataError, loadExpenses, saveExpenses } from "./expenses-storage";

export type Expense = { id: number; amount: number };
type SaveStatus = "saved" | "saving" | "error";
type Snapshot = { expenses: Expense[]; changed: boolean };
type SaveResult = { expenses: Expense[]; status: "saved" | "error" };

type ExpensesContextValue = {
  expenses: Expense[];
  totalAmount: number;
  canAddExpense: boolean;
  saveStatus: SaveStatus;
  retrySave: () => void;
  addExpense: (amount: number) => boolean;
  deleteExpense: (id: number) => void;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ expenses: [], changed: false });
  const [restoreStatus, setRestoreStatus] = useState<"loading" | "ready" | "error">("loading");
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [canAddExpense, setCanAddExpense] = useState(true);
  const currentExpenses = useRef<Expense[]>([]);
  const nextId = useRef<number | null>(1);
  const { expenses } = snapshot;
  const totalAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
  const saveStatus: SaveStatus = !snapshot.changed ? "saved"
    : saveResult?.expenses === expenses ? saveResult.status : "saving";

  useEffect(() => {
    let active = true;
    loadExpenses().then((restored) => {
      if (!active) return;
      const maxId = restored.reduce((max, expense) => Math.max(max, expense.id), 0);
      nextId.current = maxId === Number.MAX_SAFE_INTEGER ? null : maxId + 1;
      currentExpenses.current = restored;
      setCanAddExpense(nextId.current !== null);
      setSnapshot({ expenses: restored, changed: false });
      setRestoreStatus("ready");
    }).catch((error: unknown) => {
      if (!active) return;
      setRestoreError(error instanceof InvalidExpensesDataError
        ? "저장된 지출 데이터가 손상되어 복원할 수 없습니다. 원본을 보존했습니다."
        : "저장된 지출을 읽지 못했습니다. 잠시 후 다시 시도해주세요.");
      setRestoreStatus("error");
    });
    return () => { active = false; };
  }, [restoreAttempt]);

  useEffect(() => {
    // 최초 빈 배열과 복원 데이터 자체는 자동 저장하지 않는다.
    if (restoreStatus !== "ready" || !snapshot.changed) return;
    let active = true;
    saveExpenses(expenses).then(() => {
      if (active) setSaveResult({ expenses, status: "saved" });
    }).catch(() => {
      if (active) setSaveResult({ expenses, status: "error" });
    });
    // 이전 저장의 완료 알림이 최신 화면 상태를 바꾸지 않게 한다.
    return () => { active = false; };
  }, [expenses, snapshot.changed, restoreStatus, saveAttempt]);

  function addExpense(amount: number) {
    if (restoreStatus !== "ready" || nextId.current === null ||
        !Number.isSafeInteger(amount) || amount <= 0) return false;
    const previous = currentExpenses.current;
    const previousTotal = previous.reduce((total, expense) => total + expense.amount, 0);
    if (!Number.isSafeInteger(previousTotal + amount)) return false;

    const newExpense: Expense = { id: nextId.current, amount };
    nextId.current = nextId.current === Number.MAX_SAFE_INTEGER ? null : nextId.current + 1;
    const updated = [newExpense, ...previous];
    // 같은 이벤트 안의 연속 변경도 직전 결과를 기준으로 처리한다.
    currentExpenses.current = updated;
    setCanAddExpense(nextId.current !== null);
    setSnapshot({ expenses: updated, changed: true });
    return true;
  }

  function deleteExpense(id: number) {
    if (restoreStatus !== "ready") return;
    const previous = currentExpenses.current;
    const updated = previous.filter((expense) => expense.id !== id);
    if (updated.length === previous.length) return;
    currentExpenses.current = updated;
    setSnapshot({ expenses: updated, changed: true });
  }

  function retrySave() {
    setSaveResult(null);
    setSaveAttempt((attempt) => attempt + 1);
  }

  if (restoreStatus !== "ready") {
    return <ExpensesRestoreScreen
      error={restoreStatus === "error" ? restoreError : null}
      onRetry={() => {
        setRestoreStatus("loading");
        setRestoreAttempt((attempt) => attempt + 1);
      }}
    />;
  }

  return (
    <ExpensesContext.Provider value={{
      expenses, totalAmount, canAddExpense, saveStatus, retrySave, addExpense, deleteExpense,
    }}>
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
