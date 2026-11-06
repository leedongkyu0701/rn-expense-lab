import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type Expense = { id: number; amount: number };
type Snapshot = { nextId: number | null; expenses: Expense[] };

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function validateSnapshot(value: unknown): Snapshot {
  if (typeof value !== "object" || value === null ||
      !("expenses" in value) || !Array.isArray(value.expenses) ||
      !("nextId" in value)) throw new Error("잘못된 서버 저장 파일입니다.");

  let total = 0;
  let previousId = Infinity;
  for (const expense of value.expenses) {
    if (typeof expense !== "object" || expense === null ||
        !isPositiveInteger(expense.id) || !isPositiveInteger(expense.amount) ||
        expense.id >= previousId) throw new Error("잘못된 서버 지출 데이터입니다.");
    previousId = expense.id;
    total += expense.amount;
    if (!Number.isSafeInteger(total)) throw new Error("서버 지출 합계 범위를 초과했습니다.");
  }
  const maxId = value.expenses[0]?.id ?? 0;
  if (value.nextId !== null &&
      (!isPositiveInteger(value.nextId) || value.nextId <= maxId)) {
    throw new Error("잘못된 서버 ID 카운터입니다.");
  }
  return value as Snapshot;
}

export class ExpenseStore {
  private snapshot: Snapshot;
  private readonly file: string;
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(file: string, snapshot: Snapshot) {
    this.file = file;
    this.snapshot = snapshot;
  }

  static async open(file: string) {
    let snapshot: Snapshot = { nextId: 1, expenses: [] };
    try {
      snapshot = validateSnapshot(JSON.parse(await readFile(file, "utf8")));
    } catch (error) {
      // 파일 없음만 새 저장소로 처리한다. 손상된 원본은 덮어쓰지 않는다.
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    return new ExpenseStore(file, snapshot);
  }

  list() {
    return this.snapshot.expenses;
  }

  get(id: number) {
    const expense = this.snapshot.expenses.find((item) => item.id === id);
    if (!expense) throw new HttpError(404, "지출을 찾을 수 없습니다.");
    return expense;
  }

  // 읽기-검증-쓰기-메모리 반영 전체를 한 큐에서 처리한다 (서버 단일 프로세스).
  private change<T>(update: (current: Snapshot) => { snapshot: Snapshot; result: T }): Promise<T> {
    const operation = this.queue.then(async () => {
      const { snapshot, result } = update(this.snapshot);
      await mkdir(dirname(this.file), { recursive: true });
      const temporary = `${this.file}.tmp`;
      await writeFile(temporary, JSON.stringify(snapshot, null, 2), { flush: true });
      await rename(temporary, this.file);
      this.snapshot = snapshot;
      return result;
    });
    // 한 요청이 실패해도 다음 요청은 처리할 수 있다.
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  create(amount: unknown) {
    return this.change((current) => {
      if (!isPositiveInteger(amount)) throw new HttpError(400, "금액은 양의 안전한 정수여야 합니다.");
      const total = current.expenses.reduce((sum, item) => sum + item.amount, 0);
      if (!Number.isSafeInteger(total + amount)) throw new HttpError(409, "지출 합계가 안전한 정수 범위를 초과합니다.");
      if (current.nextId === null) throw new HttpError(409, "지출 ID가 안전한 정수 범위에 도달했습니다.");
      const expense = { id: current.nextId, amount };
      return {
        snapshot: {
          nextId: expense.id === Number.MAX_SAFE_INTEGER ? null : expense.id + 1,
          expenses: [expense, ...current.expenses],
        },
        result: expense,
      };
    });
  }

  delete(id: number) {
    return this.change((current) => {
      this.get(id);
      return {
        snapshot: { ...current, expenses: current.expenses.filter((item) => item.id !== id) },
        result: undefined,
      };
    });
  }
}
