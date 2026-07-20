import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api, Order } from "@/src/lib/api";
import { COLORS, formatVND, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/src/lib/theme";

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.myOrders();
      setOrders(data);
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
        <Text style={styles.title}>Đơn hàng của tôi</Text>
        <Text style={styles.count}>{orders.length} đơn</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
            <Text style={styles.emptyText}>Các đơn hàng bạn đặt sẽ hiển thị tại đây</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card} testID={`order-card-${item.id}`}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: (ORDER_STATUS_COLORS[item.status] || COLORS.muted) + "22" }]}
              >
                <View style={[styles.dot, { backgroundColor: ORDER_STATUS_COLORS[item.status] || COLORS.muted }]} />
                <Text style={[styles.statusText, { color: ORDER_STATUS_COLORS[item.status] || COLORS.muted }]}>
                  {ORDER_STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
            </View>

            <View style={styles.itemList}>
              {item.items.slice(0, 3).map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Image source={{ uri: it.image_url }} style={styles.itemImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {it.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {it.quantity} × {formatVND(it.price)}
                    </Text>
                  </View>
                </View>
              ))}
              {item.items.length > 3 ? (
                <Text style={styles.more}>+{item.items.length - 3} món khác</Text>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.addr} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              <Text style={styles.total}>{formatVND(item.total)}</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.textPrimary },
  count: { fontSize: 13, color: COLORS.textSecondary },
  empty: { padding: 48, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, letterSpacing: 0.5 },
  orderDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  itemList: { gap: 8 },
  itemRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  itemImg: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.border },
  itemName: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  itemMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  more: { fontSize: 11, color: COLORS.textSecondary, fontStyle: "italic", marginLeft: 46 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addr: { fontSize: 11, color: COLORS.textSecondary, maxWidth: 180 },
  total: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
});
