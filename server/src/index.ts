import { fileURLToPath } from "node:url";

import { createExpenseServer } from "./app.ts";
import { ExpenseStore } from "./store.ts";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3001");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT는 1~65535 정수여야 합니다.");
const file = process.env.DATA_FILE ?? fileURLToPath(new URL("../data/expenses.json", import.meta.url));
const store = await ExpenseStore.open(file);
const server = createExpenseServer(store);
server.listen(port, host, () => console.log(`Local expense API: http://${host}:${port}`));
server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
