import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Props = { error: string | null; onRetry: () => void };

export function ExpensesRestoreScreen({ error, onRetry }: Props) {
  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text accessibilityRole="alert" style={styles.message}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
            <Text style={styles.buttonText}>복원 다시 시도</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator accessibilityLabel="지출 복원 중" color="#2563eb" />
          <Text style={styles.message}>저장된 지출을 불러오는 중입니다.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: "#ffffff" },
  message: { fontSize: 16, lineHeight: 24, textAlign: "center", color: "#111111" },
  button: { padding: 16, borderRadius: 12, alignItems: "center", backgroundColor: "#2563eb" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
});
