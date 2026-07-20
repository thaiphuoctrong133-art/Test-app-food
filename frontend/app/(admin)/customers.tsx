import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api, User } from "@/src/lib/api";
import { COLORS, formatDate } from "@/src/lib/theme";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.adminCustomers();
      setCustomers(data);
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
      <View style={styles.header}>
        <Text style={styles.title}>Khách hàng</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText} testID="customers-count">
            {customers.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>Chưa có khách hàng nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card} testID={`customer-card-${item.email}`}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="mail" size={11} color={COLORS.textSecondary} />
                <Text style={styles.meta}>{item.email}</Text>
              </View>
              {item.phone ? (
                <View style={styles.metaRow}>
                  <Ionicons name="call" size={11} color={COLORS.textSecondary} />
                  <Text style={styles.meta}>{item.phone}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Ionicons name="calendar" size={11} color={COLORS.textSecondary} />
                <Text style={styles.meta}>Tham gia: {formatDate(item.created_at).split(",")[0]}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.textPrimary },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
  },
  countText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  card: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 18 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  meta: { fontSize: 12, color: COLORS.textSecondary, flexShrink: 1 },
  empty: { padding: 48, alignItems: "center", gap: 8 },
  emptyText: { color: COLORS.muted, fontSize: 14 },
});
