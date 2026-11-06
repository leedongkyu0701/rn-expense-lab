import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useExpenseQuery } from "@/features/expenses/expenses-queries";
import { ApiError } from "@/lib/api";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  // 배열, 음수, 소수, 지수 표기 등은 지출 ID로 허용하지 않는다.
  const expenseId = typeof id === "string" && /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  const isValidId = Number.isSafeInteger(expenseId);
  const query = useExpenseQuery(isValidId ? expenseId : null);
  const expense = query.data;
  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isValidId ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>잘못된 지출 ID입니다</Text>
          <Text style={styles.message}>목록에서 올바른 지출을 선택해주세요.</Text>
        </>
      ) : notFound ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>지출을 찾을 수 없습니다</Text>
          <Text style={styles.message}>삭제되었거나 서버에 없는 지출입니다.</Text>
        </>
      ) : query.isPending ? (
        <>
          <ActivityIndicator accessibilityLabel="지출 상세 조회 중" color="#2563eb" />
          <Text style={styles.message}>지출을 불러오는 중입니다.</Text>
        </>
      ) : expense ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>지출 상세</Text>
          <Text style={styles.label}>지출 ID</Text>
          <Text selectable style={styles.value}>{expense.id}</Text>
          <Text style={styles.label}>금액</Text>
          <Text style={styles.amount}>{expense.amount.toLocaleString("ko-KR")}원</Text>
        </>
      ) : null}
      {isValidId && query.isError && !notFound && (
        <>
          <Text accessibilityRole="alert" style={styles.message}>
            {expense ? "이전 조회 결과를 표시하고 있습니다. " : "지출을 불러오지 못했습니다. "}
            {query.error.message}
          </Text>
          <Pressable accessibilityRole="button" disabled={query.isFetching}
            onPress={() => { void query.refetch(); }} style={styles.button}>
            <Text style={styles.buttonText}>{query.isFetching ? "재시도 중…" : "다시 시도"}</Text>
          </Pressable>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.dismissTo("/")}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>목록으로 돌아가기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#111111" },
  label: { fontSize: 16, color: "#555555" },
  value: { fontSize: 18, color: "#111111" },
  amount: { fontSize: 32, fontWeight: "700", color: "#111111" },
  message: { fontSize: 16, lineHeight: 24, color: "#555555" },
  button: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  pressed: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
});
