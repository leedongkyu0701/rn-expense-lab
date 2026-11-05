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

import { useExpenses } from "@/features/expenses/expenses-context";

export default function NewExpenseScreen() {
  // 닫을 때 화면이 제거되므로, 다시 열면 빈 입력으로 시작한다.
  const [amount, setAmount] = useState("");
  const hasSubmitted = useRef(false);
  const { totalAmount, canAddExpense, addExpense } = useExpenses();
  const headerHeight = useHeaderHeight();
  const numericAmount = Number(amount);

  const canRecord =
    canAddExpense &&
    /^\d+$/.test(amount) &&
    Number.isSafeInteger(numericAmount) &&
    numericAmount > 0 &&
    Number.isSafeInteger(totalAmount + numericAmount);

  function closeModal() {
    Keyboard.dismiss();
    router.dismissTo("/");
  }

  function recordExpense() {
    if (!canRecord || hasSubmitted.current) return;

    // 화면이 닫히기 전 연속으로 눌러도 한 건만 추가한다.
    if (!addExpense(numericAmount)) return;
    hasSubmitted.current = true;
    setAmount("");
    closeModal();
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
        {!canAddExpense && (
          <Text accessibilityRole="alert" style={styles.text}>
            지출 ID가 안전한 정수 범위에 도달하여 더 이상 추가할 수 없습니다.
          </Text>
        )}
        <TextInput
          accessibilityLabel="지출 금액"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="예: 12000"
          placeholderTextColor="#777777"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRecord }}
          disabled={!canRecord}
          onPress={recordExpense}
          style={[styles.button, !canRecord && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>저장</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
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
