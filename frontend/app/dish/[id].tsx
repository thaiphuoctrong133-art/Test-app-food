import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, MenuItem } from "@/src/lib/api";
import { useCart } from "@/src/context/CartContext";
import { COLORS, formatVND } from "@/src/lib/theme";

export default function DishDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, count } = useCart();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMenuItem(id!);
        setItem(data);
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy món ăn</Text>
      </View>
    );
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addItem(item);
    router.push("/(tabs)/cart");
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image_url }} style={styles.image} />
        <SafeAreaView edges={["top"]} style={styles.imageOverlay}>
          <TouchableOpacity
            testID="dish-back-button"
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="dish-goto-cart"
            style={styles.iconBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Ionicons name="bag-handle" size={20} color={COLORS.textPrimary} />
            {count > 0 ? (
              <View style={styles.iconBadge}>
                <Text style={styles.iconBadgeText}>{count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.catBadge}>
          <Text style={styles.catText}>{item.category}</Text>
        </View>
        <Text style={styles.name} testID="dish-name">
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatVND(item.price)}</Text>
          <View style={styles.qtyBox}>
            <TouchableOpacity
              testID="dish-qty-minus"
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity
              testID="dish-qty-plus"
              style={styles.qtyBtn}
              onPress={() => setQty((q) => q + 1)}
            >
              <Ionicons name="add" size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <TouchableOpacity
          testID="dish-add-to-cart"
          style={styles.addBtn}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Ionicons name="bag-add" size={20} color="#FFF" />
          <Text style={styles.addText}>Thêm vào giỏ - {formatVND(item.price * qty)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  imageWrap: { height: 320, backgroundColor: COLORS.border },
  image: { width: "100%", height: "100%" },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  iconBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  catBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FDECEA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  catText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "700", color: COLORS.textPrimary, marginTop: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  price: { fontSize: 26, fontWeight: "800", color: COLORS.primary },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, minWidth: 24, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginTop: 24 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginTop: 8 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
