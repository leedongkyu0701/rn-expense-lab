import { Stack } from "expo-router";

import { AppQueryProvider } from "@/lib/query-provider";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AppQueryProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expenses/[id]" options={{ title: "지출 상세" }} />
        <Stack.Screen
          name="expenses/new"
          options={{ title: "지출 등록", presentation: "modal" }}
        />
      </Stack>
    </AppQueryProvider>
  );
}
