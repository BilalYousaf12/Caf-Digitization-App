import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme, isDark, colors } = useTheme();
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and password are required");
      return;
    }
    setSubmitting(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim() || undefined);
      }
      setEmail("");
      setPassword("");
      setDisplayName("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const code = err?.code || "";
      let friendly = "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        friendly = "No account found with this email. Check your email or sign up.";
      } else if (code === "auth/wrong-password") {
        friendly = "Incorrect password. Please try again.";
      } else if (code === "auth/invalid-email") {
        friendly = "Please enter a valid email address.";
      } else if (code === "auth/email-already-in-use") {
        friendly = "This email is already registered. Try logging in instead.";
      } else if (code === "auth/weak-password") {
        friendly = "Password must be at least 6 characters.";
      } else if (code === "auth/operation-not-allowed") {
        friendly = "Email sign-in is not enabled yet. Contact the cafe admin.";
      } else if (code === "auth/network-request-failed") {
        friendly = "Network error. Check your internet connection and try again.";
      } else if (code === "auth/too-many-requests") {
        friendly = "Too many attempts. Please wait a moment and try again.";
      } else {
        const msg = err?.message || "Something went wrong";
        friendly = msg.replace(/Firebase:\s?/gi, "").replace(/\(auth\/.*?\)\.?/g, "").trim() || "Authentication failed";
      }
      setAuthError(friendly);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const bg = isDark ? Colors.bgPrimary : colors.bgPrimary;
  const surface = isDark ? Colors.bgSurface : colors.bgSurface;
  const border = isDark ? Colors.bgCardBorder : colors.bgCardBorder;
  const textPrimary = isDark ? Colors.textPrimary : colors.textPrimary;
  const textSecondary = isDark ? Colors.textSecondary : colors.textSecondary;

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="chevron-down" size={24} color={Colors.gold} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: textPrimary }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={16} color={Colors.gold} />
            <Text style={[styles.sectionLabel, { color: Colors.gold }]}>APPEARANCE</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${Colors.gold}15` }]}>
                {isDark
                  ? <Ionicons name="moon" size={18} color={Colors.gold} />
                  : <Ionicons name="sunny" size={18} color={Colors.gold} />
                }
              </View>
              <View>
                <Text style={[styles.settingName, { color: textPrimary }]}>
                  {isDark ? "Eleganza Dark" : "Latte Light"}
                </Text>
                <Text style={[styles.settingDesc, { color: textSecondary }]}>
                  {isDark ? "Rich black & gold theme" : "Warm cream & gold theme"}
                </Text>
              </View>
            </View>
            <Switch
              value={!isDark}
              onValueChange={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTheme();
              }}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.gold}60` }}
              thumbColor={Colors.gold}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={Colors.gold} />
            <Text style={[styles.sectionLabel, { color: Colors.gold }]}>ACCOUNT</Text>
          </View>

          {authLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : user ? (
            <View style={styles.accountLoggedIn}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: "rgba(76,175,80,0.15)" }]}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingName, { color: textPrimary }]}>
                      {user.displayName || "Eleganza Member"}
                    </Text>
                    <Text style={[styles.settingDesc, { color: textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleSignOut}
                  style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.logoutBtnText}>Logout</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.authForm}>
              {authMode === "signup" && (
                <TextInput
                  style={[styles.input, { color: textPrimary, borderColor: border, backgroundColor: `${surface}CC` }]}
                  placeholder="Display Name (optional)"
                  placeholderTextColor={textSecondary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              )}
              <TextInput
                style={[styles.input, { color: textPrimary, borderColor: border, backgroundColor: `${surface}CC` }]}
                placeholder="Email"
                placeholderTextColor={textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, { color: textPrimary, borderColor: border, backgroundColor: `${surface}CC` }]}
                placeholder="Password"
                placeholderTextColor={textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {authError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#F44336" />
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleAuth}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.loginBtn,
                  submitting && { opacity: 0.6 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.bgPrimary} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={authMode === "login" ? "log-in-outline" : "person-add-outline"}
                      size={18}
                      color={Colors.bgPrimary}
                    />
                    <Text style={styles.loginBtnText}>
                      {authMode === "login" ? "Login" : "Create Account"}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                style={({ pressed }) => [styles.switchModeBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.switchModeText, { color: Colors.gold }]}>
                  {authMode === "login"
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Login"}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={[styles.section, { backgroundColor: surface, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
            <Text style={[styles.sectionLabel, { color: Colors.gold }]}>ABOUT</Text>
          </View>

          {[
            { label: "App Version", value: "1.0.0" },
            { label: "Cafe Location", value: "Green Avenue, Faisalabad" },
            { label: "Contact", value: "+92 300 123 4567" },
          ].map((row) => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: border }]}>
              <Text style={[styles.infoLabel, { color: textSecondary }]}>{row.label}</Text>
              <Text style={[styles.infoValue, { color: textPrimary }]}>{row.value}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.brandFooter}>
          <Text style={[styles.brandFooterText, { color: textSecondary }]}>
            CAFE ELEGANZA · FAISALABAD
          </Text>
          <Text style={[styles.brandFooterSub, { color: textSecondary }]}>
            Premium Board Game Lounge
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: 0.5,
  },
  section: {
    borderRadius: 18, marginBottom: 14, borderWidth: 1, overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(212,175,55,0.08)",
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  settingName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  settingDesc: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  loadingWrap: { paddingVertical: 24, alignItems: "center" },
  accountLoggedIn: {},
  authForm: { padding: 14, gap: 10 },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(244,67,54,0.1)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  errorText: {
    fontFamily: "Inter_400Regular", fontSize: 12, color: "#F44336", flex: 1,
  },
  loginBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 14,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.bgPrimary },
  switchModeBtn: { alignItems: "center", paddingVertical: 4 },
  switchModeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  logoutBtn: {
    backgroundColor: "rgba(244,67,54,0.12)", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  logoutBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#F44336" },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1,
  },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 13 },
  brandFooter: { alignItems: "center", paddingVertical: 20 },
  brandFooterText: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2 },
  brandFooterSub: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4, letterSpacing: 1 },
});
