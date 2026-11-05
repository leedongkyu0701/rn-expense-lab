import { ScrollView, StyleSheet, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>앱 소개</Text>
      <Text style={styles.text}>
        지출을 기록하고 목록과 합계를 확인하는 간단한 가계부입니다.
      </Text>
      <Text style={styles.text}>
        기록은 앱이 실행되는 동안만 유지됩니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#111111" },
  text: { fontSize: 16, lineHeight: 24, color: "#555555" },
});
