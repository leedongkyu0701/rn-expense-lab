import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: true,
      },
      // POST 응답 유실 시 자동 재전송으로 같은 지출을 만들지 않는다.
      mutations: { retry: false },
    },
  }));

  useEffect(() => {
    if (Platform.OS === "web") return;
    focusManager.setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
