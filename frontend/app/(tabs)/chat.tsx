import { useEffect, useRef, useState, useCallback } from "react";
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
import { useFocusEffect } from "expo-router";
import { api, AiMessage, SupportMessage } from "@/src/lib/api";
import { COLORS } from "@/src/lib/theme";

type Mode = "ai" | "support";

export default function CustomerChatScreen() {
  const [mode, setMode] = useState<Mode>("ai");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const loadHistory = useCallback(async () => {
    try {
      if (mode === "ai") {
        const data = await api.chatAiHistory();
        setAiMessages(data);
      } else {
        const data = await api.supportMy();
        setSupportMessages(data);
      }
    } catch {}
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        await loadHistory();
        if (alive) setLoading(false);
      })();
      // poll for support only
      const interval = setInterval(() => {
        if (mode === "support") loadHistory();
      }, 5000);
      return () => {
        alive = false;
        clearInterval(interval);
      };
    }, [mode, loadHistory]),
  );

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [aiMessages, supportMessages, mode]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      if (mode === "ai") {
        // optimistic add
        const optimistic: AiMessage = {
          id: `tmp-${Date.now()}`,
          user_id: "me",
          role: "user",
          text,
          created_at: new Date().toISOString(),
        };
        setAiMessages((prev) => [...prev, optimistic]);
        const res = await api.chatAi(text);
        setAiMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), res.user_message, res.ai_message]);
      } else {
        const msg = await api.supportSend(text);
        setSupportMessages((prev) => [...prev, msg]);
      }
    } catch (e: any) {
      // rollback optimistic
      if (mode === "ai") {
        setAiMessages((prev) => prev.filter((m) => !m.id.startsWith("tmp-")));
      }
    } finally {
      setSending(false);
    }
  };

  const messages =
    mode === "ai"
      ? aiMessages.map((m) => ({ id: m.id, mine: m.role === "user", text: m.text, when: m.created_at }))
      : supportMessages.map((m) => ({
          id: m.id,
          mine: m.sender === "customer",
          text: m.text,
          when: m.created_at,
        }));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            testID="chat-mode-ai"
            style={[styles.segItem, mode === "ai" && styles.segItemActive]}
            onPress={() => setMode("ai")}
          >
            <Ionicons name="sparkles" size={14} color={mode === "ai" ? "#FFF" : COLORS.textSecondary} />
            <Text style={[styles.segText, mode === "ai" && styles.segTextActive]}>Trợ lý AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="chat-mode-support"
            style={[styles.segItem, mode === "support" && styles.segItemActive]}
            onPress={() => setMode("support")}
          >
            <Ionicons name="headset" size={14} color={mode === "support" ? "#FFF" : COLORS.textSecondary} />
            <Text style={[styles.segText, mode === "support" && styles.segTextActive]}>Hỗ trợ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name={mode === "ai" ? "sparkles-outline" : "chatbubbles-outline"}
                  size={48}
                  color={COLORS.muted}
                />
                <Text style={styles.emptyTitle}>
                  {mode === "ai" ? "Chat với trợ lý AI của Tpt" : "Nhắn tin với quán Tpt"}
                </Text>
                <Text style={styles.emptyText}>
                  {mode === "ai"
                    ? "Hỏi bất kỳ điều gì về món ăn, gợi ý combo, hoặc cách đặt hàng."
                    : "Đội ngũ hỗ trợ của quán sẽ phản hồi trong thời gian sớm nhất."}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}
                testID={`msg-${item.mine ? "mine" : "theirs"}`}
              >
                {!item.mine && mode === "ai" ? (
                  <View style={styles.aiTag}>
                    <Ionicons name="sparkles" size={10} color={COLORS.secondary} />
                    <Text style={styles.aiTagText}>Tpt AI</Text>
                  </View>
                ) : null}
                {!item.mine && mode === "support" ? (
                  <View style={styles.aiTag}>
                    <Ionicons name="headset" size={10} color={COLORS.secondary} />
                    <Text style={styles.aiTagText}>Nhân viên Tpt</Text>
                  </View>
                ) : null}
                <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>{item.text}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            testID="chat-input"
            style={styles.input}
            placeholder={mode === "ai" ? "Hỏi AI bất kỳ điều gì..." : "Nhắn tin cho quán..."}
            placeholderTextColor={COLORS.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            testID="chat-send-button"
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
  header: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 26, fontWeight: "700", color: COLORS.textPrimary },
  segment: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
  },
  segItemActive: { backgroundColor: COLORS.primary },
  segText: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 13 },
  segTextActive: { color: "#FFF" },
  empty: { padding: 40, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginTop: 8 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
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
  aiTag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  aiTagText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: "700" },
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
