import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, formatDate } from "@/src/lib/theme";

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tài khoản</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={36} color="#FFF" />
          </View>
          <Text style={styles.name} testID="admin-profile-name">
            {user.name}
          </Text>
          <Text style={styles.email} testID="admin-profile-email">
            {user.email}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Quản trị viên</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.rowLabel}>Ngày tạo</Text>
            <Text style={styles.rowValue}>{formatDate(user.created_at).split(",")[0]}</Text>
          </View>
        </View>

        <TouchableOpacity testID="admin-logout" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.textPrimary },
  profileCard: {
    alignItems: "center",
    padding: 24,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2D2424",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  email: { fontSize: 13, color: COLORS.textSecondary },
  roleBadge: {
    marginTop: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: { color: "#2D2424", fontWeight: "700", fontSize: 12 },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  rowValue: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "#FDECEA",
  },
  logoutText: { color: COLORS.danger, fontWeight: "700", fontSize: 15 },
});
