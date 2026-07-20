import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api, SupportConversation } from "@/src/lib/api";
import { COLORS, formatDate } from "@/src/lib/theme";

export default function AdminChatList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.supportConversations();
      setConversations(data);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        await load();
        if (alive) setLoading(false);
      })();
      const interval = setInterval(load, 5000);
      return () => {
        alive = false;
        clearInterval(interval);
      };
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
        <Text style={styles.title}>Chat khách hàng</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText} testID="chat-convs-count">
            {conversations.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.user_id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
            <Text style={styles.emptyText}>Khi khách hàng nhắn tin, hội thoại sẽ xuất hiện tại đây</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/chat/${item.user_id}` as any)}
            testID={`chat-conv-${item.user_email}`}
            activeOpacity={0.85}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.user_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.user_name}
                </Text>
                <Text style={styles.time}>{formatDate(item.last_time).split(",")[1]?.trim() || ""}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_sender === "admin" ? "Bạn: " : ""}
                {item.last_message}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
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
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, flex: 1 },
  time: { fontSize: 10, color: COLORS.textSecondary, marginLeft: 8 },
  preview: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empty: { padding: 48, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center" },
});
