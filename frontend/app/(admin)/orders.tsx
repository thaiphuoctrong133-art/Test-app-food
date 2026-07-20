import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api, Order } from "@/src/lib/api";
import { COLORS, formatVND, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/src/lib/theme";

const STATUSES = ["pending", "confirmed", "delivering", "completed", "cancelled"] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const data = await api.adminOrders();
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

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await api.adminUpdateOrder(id, status);
      await load();
      setSelected((prev) => (prev ? { ...prev, status } : null));
    } catch {}
    setUpdating(false);
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
        <Text style={styles.title}>Đơn hàng</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText} testID="admin-orders-count">
            {orders.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelected(item)}
            testID={`admin-order-${item.id}`}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderCust}>{item.user_name}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: (ORDER_STATUS_COLORS[item.status] || COLORS.muted) + "22" },
                ]}
              >
                <Text style={[styles.statusText, { color: ORDER_STATUS_COLORS[item.status] || COLORS.muted }]}>
                  {ORDER_STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
              <Text style={styles.orderTotal}>{formatVND(item.total)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SafeAreaView edges={["bottom"]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
                <TouchableOpacity
                  testID="admin-order-close"
                  onPress={() => setSelected(null)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {selected ? (
                <View style={{ padding: 20, gap: 14 }}>
                  <View>
                    <Text style={styles.detailLabel}>Mã đơn</Text>
                    <Text style={styles.detailValue}>#{selected.id.slice(0, 8).toUpperCase()}</Text>
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Khách hàng</Text>
                      <Text style={styles.detailValue}>{selected.user_name}</Text>
                      <Text style={styles.detailMeta}>{selected.user_email}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>SĐT</Text>
                      <Text style={styles.detailValue}>{selected.phone}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Địa chỉ</Text>
                    <Text style={styles.detailValue}>{selected.address}</Text>
                  </View>
                  {selected.note ? (
                    <View>
                      <Text style={styles.detailLabel}>Ghi chú</Text>
                      <Text style={styles.detailValue}>{selected.note}</Text>
                    </View>
                  ) : null}

                  <View style={styles.itemsBox}>
                    <Text style={styles.detailLabel}>Món ({selected.items.length})</Text>
                    {selected.items.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Image source={{ uri: it.image_url }} style={styles.itemImg} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{it.name}</Text>
                          <Text style={styles.itemMeta}>
                            {it.quantity} × {formatVND(it.price)}
                          </Text>
                        </View>
                        <Text style={styles.itemTotal}>{formatVND(it.price * it.quantity)}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>{formatVND(selected.total)}</Text>
                  </View>

                  <Text style={styles.detailLabel}>Cập nhật trạng thái</Text>
                  <View style={styles.statusList}>
                    {STATUSES.map((s) => (
                      <TouchableOpacity
                        key={s}
                        testID={`status-${s}`}
                        onPress={() => updateStatus(selected.id, s)}
                        style={[
                          styles.statusChip,
                          selected.status === s && {
                            backgroundColor: ORDER_STATUS_COLORS[s],
                            borderColor: ORDER_STATUS_COLORS[s],
                          },
                        ]}
                        disabled={updating}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            selected.status === s && { color: "#FFF" },
                          ]}
                        >
                          {ORDER_STATUS_LABELS[s]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </SafeAreaView>
          </View>
        </View>
      </Modal>
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
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  orderCust: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderDate: { fontSize: 11, color: COLORS.textSecondary },
  orderTotal: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  empty: { padding: 48, alignItems: "center", gap: 8 },
  emptyText: { color: COLORS.muted, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: 12 },
  detailLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", fontWeight: "700", letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: COLORS.textPrimary, marginTop: 4, fontWeight: "600" },
  detailMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemsBox: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  itemImg: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.border },
  itemName: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  itemMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalValue: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  statusList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statusChipText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: "600" },
});
