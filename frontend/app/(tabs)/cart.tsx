import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";
import { COLORS, formatVND } from "@/src/lib/theme";

export default function CartScreen() {
  const { lines, updateQty, removeItem, total, clear, count } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!address.trim() || !phone.trim()) {
      setError("Vui lòng nhập địa chỉ và số điện thoại");
      return;
    }
    if (lines.length === 0) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.createOrder({
        items: lines.map((l) => ({
          menu_id: l.item.id,
          name: l.item.name,
          price: l.item.price,
          quantity: l.quantity,
          image_url: l.item.image_url,
        })),
        total,
        address: address.trim(),
        phone: phone.trim(),
        note: note.trim(),
      });
      clear();
      setAddress("");
      setNote("");
      setSuccess("Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.");
      setTimeout(() => {
        setSuccess(null);
        router.push("/(tabs)/orders");
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Giỏ hàng</Text>
        <Text style={styles.count} testID="cart-count-text">
          {count} món
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bag-handle-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptyText}>Chọn món ăn yêu thích để bắt đầu</Text>
            <TouchableOpacity
              testID="cart-browse-menu"
              style={styles.browseBtn}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.browseBtnText}>Xem thực đơn</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {lines.map((l) => (
              <View key={l.item.id} style={styles.line} testID={`cart-line-${l.item.name}`}>
                <Image source={{ uri: l.item.image_url }} style={styles.lineImg} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {l.item.name}
                  </Text>
                  <Text style={styles.linePrice}>{formatVND(l.item.price)}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      testID={`qty-minus-${l.item.name}`}
                      style={styles.qtyBtn}
                      onPress={() => updateQty(l.item.id, l.quantity - 1)}
                    >
                      <Ionicons name="remove" size={14} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{l.quantity}</Text>
                    <TouchableOpacity
                      testID={`qty-plus-${l.item.name}`}
                      style={styles.qtyBtn}
                      onPress={() => updateQty(l.item.id, l.quantity + 1)}
                    >
                      <Ionicons name="add" size={14} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  testID={`remove-${l.item.name}`}
                  style={styles.trash}
                  onPress={() => removeItem(l.item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
              <TextInput
                testID="checkout-address-input"
                style={styles.input}
                placeholder="Địa chỉ giao hàng"
                placeholderTextColor={COLORS.muted}
                value={address}
                onChangeText={setAddress}
                multiline
              />
              <TextInput
                testID="checkout-phone-input"
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                testID="checkout-note-input"
                style={styles.input}
                placeholder="Ghi chú (tùy chọn)"
                placeholderTextColor={COLORS.muted}
                value={note}
                onChangeText={setNote}
                multiline
              />
            </View>

            {error ? (
              <View style={styles.errorBox} testID="checkout-error">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={styles.successBox} testID="checkout-success">
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        {lines.length > 0 ? (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue} testID="cart-total">
                {formatVND(total)}
              </Text>
            </View>
            <TouchableOpacity
              testID="checkout-submit-button"
              style={[styles.checkoutBtn, submitting && { opacity: 0.7 }]}
              onPress={handleCheckout}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.checkoutText}>Đặt hàng (COD)</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.textPrimary },
  count: { fontSize: 13, color: COLORS.textSecondary },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  browseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  browseBtnText: { color: "#FFF", fontWeight: "700" },
  line: {
    flexDirection: "row",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    gap: 12,
    alignItems: "center",
  },
  lineImg: { width: 60, height: 60, borderRadius: 12, backgroundColor: COLORS.border },
  lineName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  linePrice: { fontSize: 13, color: COLORS.primary, fontWeight: "600", marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 10 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyText: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, minWidth: 20, textAlign: "center" },
  trash: { padding: 6 },
  section: { marginHorizontal: 16, marginTop: 12, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 48,
  },
  errorBox: { marginHorizontal: 16, marginTop: 12, backgroundColor: "#FDECEA", padding: 12, borderRadius: 12 },
  errorText: { color: COLORS.danger, fontSize: 13 },
  successBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  successText: { color: COLORS.success, fontSize: 13, flex: 1, fontWeight: "600" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  totalLabel: { fontSize: 15, color: COLORS.textSecondary },
  totalValue: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },
  checkoutText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
