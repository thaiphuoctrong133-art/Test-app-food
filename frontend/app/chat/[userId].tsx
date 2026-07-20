import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { api, SupportMessage, User } from "@/src/lib/api";
import { COLORS } from "@/src/lib/theme";

export default function AdminChatDetail() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [target, setTarget] = useState<User | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.supportConversation(userId);
      setMessages(data.messages);
      setTarget(data.user);
    } catch {}
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        await load();
        if (alive) setLoading(false);
      })();
      const interval = setInterval(load, 4000);
      return () => {
        alive = false;
        clearInterval(interval);
      };
    }, [load]),
  );

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !userId) return;
    setSending(true);
    setInput("");
    try {
      const msg = await api.supportSend(text, userId);
      setMessages((prev) => [...prev, msg]);
    } catch {}
    setSending(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="admin-chat-back"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{target?.name.charAt(0).toUpperCase() || "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} testID="admin-chat-user-name">
            {target?.name || "Khách hàng"}
          </Text>
          <Text style={styles.email}>{target?.email}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>Bắt đầu trò chuyện với khách hàng</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender === "admin";
            return (
              <View
                style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}
                testID={`admin-msg-${mine ? "mine" : "theirs"}`}
              >
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            testID="admin-chat-input"
            style={styles.input}
            placeholder="Nhắn cho khách hàng..."
            placeholderTextColor={COLORS.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            testID="admin-chat-send"
            style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.5 }]}
            onPress={send}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="send" size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  email: { fontSize: 12, color: COLORS.textSecondary },
  empty: { padding: 48, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: "#FFF" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
