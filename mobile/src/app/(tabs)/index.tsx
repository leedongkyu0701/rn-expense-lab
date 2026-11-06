import { router } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { totalExpenses } from "@/features/expenses/expense";
import { useDeleteExpense, useExpensesQuery } from "@/features/expenses/expenses-queries";

export default function HomeScreen() {
  const query = useExpensesQuery();
  const deletion = useDeleteExpense();
  const deleting = useRef(false);
  const expenses = query.data ?? [];
  const totalAmount = totalExpenses(expenses);

  function removeExpense(id: number) {
    if (deleting.current) return;
    deleting.current = true;
    deletion.mutate(id, { onSettled: () => { deleting.current = false; } });
  }

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

      {query.data !== undefined && (
        <Text style={styles.summary}>
          총 {expenses.length}건 · {totalAmount.toLocaleString("ko-KR")}원
        </Text>
      )}
      {query.isPending && (
        <ActivityIndicator accessibilityLabel="지출 목록 조회 중" color="#2563eb" />
      )}
      {query.isError && (
        <View style={styles.status}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {query.data !== undefined ? "기존 목록을 표시하고 있습니다. " : ""}{query.error.message}
          </Text>
          <Pressable accessibilityRole="button" disabled={query.isFetching}
            onPress={() => { void query.refetch(); }} style={styles.retryButton}>
            <Text style={styles.detailHint}>{query.isFetching ? "재시도 중…" : "다시 시도"}</Text>
          </Pressable>
        </View>
      )}
      {deletion.isError && (
        <Text accessibilityRole="alert" style={styles.errorText}>
          삭제하지 못했습니다. {deletion.error.message}
        </Text>
      )}

      <FlatList
        style={styles.list}
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical
        refreshing={query.isRefetching}
        onRefresh={() => { if (!query.isFetching) void query.refetch(); }}
        ListEmptyComponent={
          query.isSuccess ? <Text style={styles.emptyText}>첫 지출을 기록해보세요.</Text> : undefined
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
              accessibilityState={{ disabled: deletion.isPending }}
              disabled={deletion.isPending}
              onPress={() => removeExpense(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>
                {deletion.isPending && deletion.variables === item.id ? "삭제 중…" : "삭제"}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  status: { gap: 8 },
  errorText: { color: "#dc2626", fontSize: 14, lineHeight: 20 },
  retryButton: { paddingVertical: 12, alignSelf: "flex-start" },
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
