import { router } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { totalExpenses } from "@/features/expenses/expense";
import { useCreateExpense, useExpensesQuery } from "@/features/expenses/expenses-queries";

export default function NewExpenseScreen() {
  // 닫을 때 화면이 제거되므로, 다시 열면 빈 입력으로 시작한다.
  const [amount, setAmount] = useState("");
  // 렌더 이전의 연속 탭까지 막는다. 실패하면 잠금을 해제한다.
  const submitting = useRef(false);
  const creation = useCreateExpense();
  const list = useExpensesQuery();
  const totalAmount = list.data ? totalExpenses(list.data) : undefined;
  const headerHeight = useHeaderHeight();
  const numericAmount = Number(amount);

  const canRecord =
    !creation.isPending &&
    /^\d+$/.test(amount) &&
    Number.isSafeInteger(numericAmount) &&
    numericAmount > 0 &&
    (totalAmount === undefined || Number.isSafeInteger(totalAmount + numericAmount));

  function closeModal() {
    Keyboard.dismiss();
    router.dismissTo("/");
  }

  async function recordExpense() {
    if (!canRecord || submitting.current) return;
    submitting.current = true;
    try {
      // 서버가 최신 합계와 ID 범위를 최종 검증한다.
      await creation.mutateAsync(numericAmount);
      closeModal();
    } catch {
      submitting.current = false;
      // mutation.error를 표시하고 입력값은 유지한다.
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.text}>금액</Text>
        {totalAmount !== undefined && Number.isSafeInteger(numericAmount) && numericAmount > 0 &&
          !Number.isSafeInteger(totalAmount + numericAmount) && (
          <Text accessibilityRole="alert" style={styles.text}>
            지출 합계가 안전한 정수 범위를 초과합니다.
          </Text>
        )}
        {creation.isError && (
          <Text accessibilityRole="alert" style={styles.text}>
            {creation.error.message} 입력값을 확인한 후 다시 저장할 수 있습니다.
          </Text>
        )}
        <TextInput
          accessibilityLabel="지출 금액"
          style={styles.input}
          value={amount}
          editable={!creation.isPending}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="예: 12000"
          placeholderTextColor="#777777"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRecord, busy: creation.isPending }}
          disabled={!canRecord}
          onPress={() => { void recordExpense(); }}
          style={[styles.button, !canRecord && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>{creation.isPending ? "저장 중…" : "저장"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: creation.isPending }}
          disabled={creation.isPending}
          onPress={closeModal}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, gap: 16 },
  text: { fontSize: 16, color: "#111111" },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#111111",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  disabledButton: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  cancelButton: { padding: 16, borderRadius: 12, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#2563eb" },
});
