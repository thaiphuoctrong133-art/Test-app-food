import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, formatDate } from "@/src/lib/theme";

export default function ProfileScreen() {
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
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name} testID="profile-name">
            {user.name}
          </Text>
          <Text style={styles.email} testID="profile-email">
            {user.email}
          </Text>
          {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.rowLabel}>Ngày tham gia</Text>
            <Text style={styles.rowValue}>{formatDate(user.created_at).split(",")[0]}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.rowLabel}>Loại tài khoản</Text>
            <Text style={styles.rowValue}>{user.role === "admin" ? "Quản trị viên" : "Khách hàng"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            testID="profile-my-orders"
            style={styles.actionRow}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <Ionicons name="receipt-outline" size={20} color={COLORS.textPrimary} />
            <Text style={styles.actionText}>Đơn hàng của tôi</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity testID="profile-logout" style={styles.logoutBtn} onPress={handleLogout}>
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
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { color: "#FFF", fontSize: 32, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  email: { fontSize: 13, color: COLORS.textSecondary },
  phone: { fontSize: 13, color: COLORS.textSecondary },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 8,
    marginTop: 4,
  },
  row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  rowValue: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 14 },
  actionText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: "600" },
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
