import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useExpenses } from "@/features/expenses/expenses-context";

export default function HomeScreen() {
  const { expenses, totalAmount, deleteExpense } = useExpenses();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>지출 기록</Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/expenses/new")}
        style={styles.button}
      >
        <Text style={styles.buttonText}>지출 추가</Text>
      </Pressable>

      <Text style={styles.summary}>
        총 {expenses.length}건 · {totalAmount.toLocaleString("ko-KR")}원
      </Text>

      <FlatList
        style={styles.list}
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            첫 지출을 기록해보세요.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.amount}원 지출 상세 보기`}
              onPress={() =>
                router.push({
                  pathname: "/expenses/[id]",
                  params: { id: String(item.id) },
                })
              }
              style={({ pressed }) => [styles.expenseDetails, pressed && styles.pressed]}
            >
              <Text style={styles.expenseAmount}>
                {item.amount.toLocaleString("ko-KR")}원
              </Text>
              <Text style={styles.detailHint}>상세 보기</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.amount}원 지출 삭제`}
              onPress={() => deleteExpense(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>삭제</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  summary: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#111111",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyText: {
    paddingVertical: 24,
    textAlign: "center",
    fontSize: 16,
    color: "#777777",
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  expenseDetails: {
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    gap: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  detailHint: {
    fontSize: 12,
    color: "#2563eb",
  },
  expenseAmount: {
    fontSize: 16,
    color: "#111111",
  },
  deleteButton: {
    padding: 12,
  },
  deleteText: {
    fontWeight: "600",
    color: "#dc2626",
  },
});
