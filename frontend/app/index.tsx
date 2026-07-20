import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS } from "@/src/lib/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.replace("/(admin)/dashboard");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: "https://images.pexels.com/photos/34523696/pexels-photo-34523696.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      }}
      style={styles.bg}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(45,36,36,0.3)", "rgba(45,36,36,0.85)", "rgba(45,36,36,0.98)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.top}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Ẩm thực truyền thống</Text>
          </View>
        </View>

        <View style={styles.center}>
          <Text style={styles.brand}>Tpt</Text>
          <Text style={styles.subtitle}>Hương vị Việt Nam{"\n"}đậm đà, ấm áp</Text>
          <Text style={styles.description}>
            Bánh bèo · Bánh mì · Bún · Phở{"\n"}Món ngon giao tận nhà
          </Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            testID="welcome-login-button"
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="welcome-register-button"
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#2D2424" },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  top: { alignItems: "flex-start", paddingTop: 16 },
  badge: {
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    borderColor: "rgba(255, 193, 7, 0.6)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: COLORS.secondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  center: { flex: 1, justifyContent: "center" },
  brand: { color: "#FFF", fontSize: 96, fontWeight: "700", letterSpacing: -2, marginBottom: 8 },
  subtitle: { color: "#FFF", fontSize: 32, fontWeight: "600", lineHeight: 40, marginBottom: 16 },
  description: { color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 24 },
  bottom: { gap: 12, paddingBottom: 16 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  secondaryButton: {
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
