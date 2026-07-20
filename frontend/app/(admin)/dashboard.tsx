import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, formatVND } from "@/src/lib/theme";

type Stats = { total_customers: number; total_orders: number; total_menu: number; total_revenue: number };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.adminStats();
      setStats(data);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await load();
        setLoading(false);
      })();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Admin</Text>
            <Text style={styles.name} testID="admin-name">
              {user?.name}
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.secondary} />
            <Text style={styles.badgeText}>Quản trị viên</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Doanh thu tổng</Text>
          <Text style={styles.heroValue} testID="admin-revenue">
            {formatVND(stats?.total_revenue || 0)}
          </Text>
          <Text style={styles.heroSub}>Từ tất cả đơn hàng đã đặt</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="receipt"
            label="Đơn hàng"
            value={String(stats?.total_orders || 0)}
            color={COLORS.primary}
            testID="stat-orders"
          />
          <StatCard
            icon="people"
            label="Khách hàng"
            value={String(stats?.total_customers || 0)}
            color="#1976D2"
            testID="stat-customers"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="restaurant"
            label="Món ăn"
            value={String(stats?.total_menu || 0)}
            color="#388E3C"
            testID="stat-menu"
          />
          <StatCard
            icon="trending-up"
            label="Trung bình / đơn"
            value={
              stats && stats.total_orders > 0
                ? formatVND(Math.round(stats.total_revenue / stats.total_orders))
                : formatVND(0)
            }
            color="#7B1FA2"
            testID="stat-avg"
          />
        </View>

        <View style={styles.tip}>
          <Ionicons name="information-circle" size={18} color={COLORS.primary} />
          <Text style={styles.tipText}>
            Xem danh sách khách hàng và đơn hàng chi tiết ở các tab bên dưới.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  testID,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  testID: string;
}) {
  return (
    <View style={styles.stat} testID={testID}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { fontSize: 13, color: COLORS.textSecondary },
  name: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2D2424",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: COLORS.secondary, fontSize: 11, fontWeight: "700" },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 22,
    gap: 4,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  heroValue: { color: "#FFF", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary },
  statValue: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    marginTop: 4,
  },
  tipText: { flex: 1, fontSize: 12, color: COLORS.textPrimary },
});
