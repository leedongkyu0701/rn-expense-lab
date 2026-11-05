import { Pressable, StyleSheet, Text, View } from "react-native";

import { useExpenses } from "./expenses-context";

export function ExpensesStorageStatus() {
  const { saveStatus, retrySave } = useExpenses();
  return (
    <View style={styles.container}>
      <Text accessibilityLiveRegion="polite" style={styles.message}>
        {saveStatus === "saving" ? "기기에 저장 중…"
          : saveStatus === "error" ? "저장하지 못했습니다. 현재 변경은 앱을 종료하면 사라질 수 있습니다."
            : "기기에 저장 완료"}
      </Text>
      {saveStatus === "error" && (
        <Pressable accessibilityRole="button" onPress={retrySave} style={styles.button}>
          <Text style={styles.buttonText}>저장 다시 시도</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  message: { fontSize: 14, lineHeight: 20, color: "#555555" },
  button: { padding: 12, borderRadius: 12, alignItems: "center", backgroundColor: "#2563eb" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
});
