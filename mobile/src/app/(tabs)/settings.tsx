import { ScrollView, StyleSheet, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>앱 소개</Text>
      <Text style={styles.text}>
        지출을 기록하고 목록과 합계를 확인하는 간단한 가계부입니다.
      </Text>
      <Text style={styles.text}>
        지출과 삭제 결과는 연결된 API 서버에 저장됩니다. 앱에서 조회·등록·삭제하려면 서버에 연결할 수 있어야 합니다.
      </Text>
      <Text style={styles.text}>
        앱의 조회 캐시는 메모리에만 유지됩니다. 이전 버전의 기기 기록은 보존하지만 이번 서버 목록으로 이전하지 않습니다.
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
