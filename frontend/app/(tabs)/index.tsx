import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, MenuItem } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { COLORS, formatVND } from "@/src/lib/theme";

const ALL = "Tất cả";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { addItem } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>(ALL);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      setItems(data);
    } catch (e) {
      // noop
    }
  };

  useEffect(() => {
    (async () => {
      await loadMenu();
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return [ALL, ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    if (selectedCat === ALL) return items;
    return items.filter((i) => i.category === selectedCat);
  }, [items, selectedCat]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
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
      {/* Sticky header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Xin chào,</Text>
          <Text style={styles.name} testID="home-user-name">
            {user?.name || "Khách"} 👋
          </Text>
        </View>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>Tpt</Text>
        </View>
      </View>

      <View style={styles.heroWrap}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Ẩm thực Việt{"\n"}truyền thống</Text>
          <Text style={styles.heroSubtitle}>Đặt ngay - Giao tận nơi</Text>
        </View>
      </View>

      {/* Categories chip row (sticky-ish, part of header) */}
      <View style={styles.chipRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categories.map((c) => {
            const active = c === selectedCat;
            return (
              <TouchableOpacity
                key={c}
                testID={`category-chip-${c}`}
                onPress={() => setSelectedCat(c)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>Chưa có món ăn nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`dish-card-${item.name}`}
            style={styles.card}
            onPress={() => router.push(`/dish/${item.id}` as any)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.image_url }} style={styles.cardImg} />
            <View style={styles.cardBody}>
              <Text style={styles.cardCat}>{item.category}</Text>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardPrice}>{formatVND(item.price)}</Text>
                <TouchableOpacity
                  testID={`add-to-cart-${item.name}`}
                  style={styles.addBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    addItem(item);
                  }}
                >
                  <Ionicons name="add" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  hello: { fontSize: 13, color: COLORS.textSecondary },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, marginTop: 2 },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#FFF", fontWeight: "800", fontSize: 16, letterSpacing: -0.5 },
  heroWrap: { paddingHorizontal: 16, paddingTop: 12 },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    minHeight: 100,
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTitle: { color: "#FFF", fontSize: 22, fontWeight: "700", lineHeight: 28 },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 8 },
  chipRowWrap: { height: 56, marginTop: 8 },
  chipRow: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: "#FFF" },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardImg: { width: "100%", aspectRatio: 1, backgroundColor: COLORS.border },
  cardBody: { padding: 10, gap: 4 },
  cardCat: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  cardName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { padding: 48, alignItems: "center", gap: 12 },
  emptyText: { color: COLORS.muted, fontSize: 14 },
});
