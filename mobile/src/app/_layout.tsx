import { Stack } from "expo-router";

import { ExpensesProvider } from "@/features/expenses/expenses-context";

export default function RootLayout() {
  return (
    <ExpensesProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "지출 목록" }} />
        <Stack.Screen name="expenses/[id]" options={{ title: "지출 상세" }} />
      </Stack>
    </ExpensesProvider>
  );
}
