import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useExpenses } from "@/features/expenses/expenses-context";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { expenses } = useExpenses();

  // 배열, 음수, 소수, 지수 표기 등은 지출 ID로 허용하지 않는다.
  const expenseId = typeof id === "string" && /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  const isValidId = Number.isSafeInteger(expenseId);
  const expense = isValidId ? expenses.find((item) => item.id === expenseId) : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {expense ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>지출 상세</Text>
          <Text style={styles.label}>지출 ID</Text>
          <Text selectable style={styles.value}>{expense.id}</Text>
          <Text style={styles.label}>금액</Text>
          <Text style={styles.amount}>{expense.amount.toLocaleString("ko-KR")}원</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.title}>
            {isValidId ? "지출을 찾을 수 없습니다" : "잘못된 지출 ID입니다"}
          </Text>
          <Text style={styles.message}>
            {isValidId
              ? "삭제되었거나 현재 기록에 없는 지출입니다. 목록에서 지출을 다시 선택해주세요."
              : "올바른 지출을 확인할 수 없습니다. 목록에서 지출을 선택해주세요."}
          </Text>
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
