import { Stack } from "expo-router";

import { ExpensesProvider } from "@/features/expenses/expenses-context";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ExpensesProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expenses/[id]" options={{ title: "지출 상세" }} />
        <Stack.Screen
          name="expenses/new"
          options={{ title: "지출 등록", presentation: "modal" }}
        />
      </Stack>
    </ExpensesProvider>
  );
}
