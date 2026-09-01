import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { queryClient, apiRequest } from "@/lib/query-client";
import Colors from "@/constants/colors";
import { useToast } from "@/contexts/ToastContext";

const API_BASE =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "http://localhost:5000";

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<"rush" | "news" | "leaderboard">("rush");
  const [rushLevel, setRushLevel] = useState<"green" | "yellow" | "red">("green");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [newWins, setNewWins] = useState("");
  const [newGame, setNewGame] = useState("monopoly");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        Alert.alert("Error", "Invalid password");
      }
    } catch {
      Alert.alert("Error", "Connection failed");
    }
  };

  const { data: newsPosts, refetch: refetchNews } = useQuery({
    queryKey: ["/api/news/all"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/news/all`, {
        headers: { "x-admin-password": password },
      });
      return res.json();
    },
    enabled: authenticated,
  });

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/leaderboard`);
      return res.json();
    },
    enabled: authenticated,
  });

  const updateRush = async (level: string) => {
    await fetch(`${API_BASE}/api/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ level }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/status"] });
    const labels: Record<string, string> = { green: "Chill Vibes", yellow: "Buzzing", red: "Full House" };
    showToast(`🔔 Rush status updated to "${labels[level]}"`);
  };

  const addNewsPost = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      Alert.alert("Error", "Title and body are required");
      return;
    }
    await fetch(`${API_BASE}/api/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ title: newTitle, body: newBody, imageUrl: newImageUrl }),
    });
    setNewTitle("");
    setNewBody("");
    setNewImageUrl("");
    refetchNews();
    queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    showToast(`📰 New post published: "${newTitle}"`);
  };

  const deleteNews = async (id: string) => {
    await fetch(`${API_BASE}/api/news/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    refetchNews();
    queryClient.invalidateQueries({ queryKey: ["/api/news"] });
  };

  const addPlayer = async () => {
    if (!newPlayer.trim() || !newWins.trim()) {
      Alert.alert("Error", "Name and wins are required");
      return;
    }
    await fetch(`${API_BASE}/api/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ playerName: newPlayer, winsCount: parseInt(newWins) || 0, game: newGame }),
    });
    setNewPlayer("");
    setNewWins("");
    refetchLeaderboard();
    queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
  };

  const deletePlayer = async (id: string) => {
    await fetch(`${API_BASE}/api/leaderboard/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    refetchLeaderboard();
    queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
  };

  if (!authenticated) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.loginWrap, { paddingTop: insets.top + 40 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.lockWrap}>
            <Ionicons name="lock-closed" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.loginTitle}>Admin Dashboard</Text>
          <Text style={styles.loginSub}>Enter password to continue</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.8 }]}
            onPress={handleLogin}
          >
            <LinearGradient
              colors={[Colors.gold, Colors.goldDim]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.loginBtnText}>Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const SECTIONS = [
    { key: "rush" as const, label: "Rush Meter", icon: "speedometer" as const },
    { key: "news" as const, label: "Daily News", icon: "newspaper" as const },
    { key: "leaderboard" as const, label: "Leaderboard", icon: "trophy" as const },
  ];

  const RUSH_OPTIONS: Array<{ level: "green" | "yellow" | "red"; label: string; color: string }> = [
    { level: "green", label: "Chill Vibes", color: Colors.statusGreen },
    { level: "yellow", label: "Buzzing", color: Colors.statusYellow },
    { level: "red", label: "Full House", color: Colors.statusRed },
  ];

  const GAME_OPTIONS = ["monopoly", "chess", "catan", "risk"];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.adminHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.adminTitle}>Admin Panel</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionBar}>
          {SECTIONS.map((s) => (
            <Pressable
              key={s.key}
              style={[styles.sectionChip, activeSection === s.key && styles.sectionChipActive]}
              onPress={() => setActiveSection(s.key)}
            >
              <Ionicons
                name={s.icon}
                size={14}
                color={activeSection === s.key ? Colors.bgPrimary : Colors.textSecondary}
              />
              <Text style={[styles.sectionChipText, activeSection === s.key && styles.sectionChipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {activeSection === "rush" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Set Rush Level</Text>
            {RUSH_OPTIONS.map((opt) => (
              <Pressable
                key={opt.level}
                style={[
                  styles.rushOption,
                  rushLevel === opt.level && { borderColor: opt.color },
                ]}
                onPress={() => {
                  setRushLevel(opt.level);
                  updateRush(opt.level);
                }}
              >
                <View style={[styles.rushDot, { backgroundColor: opt.color }]} />
                <Text style={styles.rushOptionText}>{opt.label}</Text>
                {rushLevel === opt.level && (
                  <Ionicons name="checkmark-circle" size={20} color={opt.color} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {activeSection === "news" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add News Post</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={Colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Body / Description"
              placeholderTextColor={Colors.textSecondary}
              value={newBody}
              onChangeText={setNewBody}
              multiline
              textAlignVertical="top"
            />
            <TextInput
              style={styles.input}
              placeholder="Image URL (optional)"
              placeholderTextColor={Colors.textSecondary}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
            />
            <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]} onPress={addNewsPost}>
              <Ionicons name="add-circle" size={18} color={Colors.bgPrimary} />
              <Text style={styles.addBtnText}>Publish Post</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Existing Posts</Text>
            {(newsPosts || []).map((post: any) => (
              <View key={post.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{post.title}</Text>
                  <Text style={styles.listItemSub} numberOfLines={2}>{post.body}</Text>
                </View>
                <Pressable onPress={() => deleteNews(post.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash" size={16} color={Colors.statusRed} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {activeSection === "leaderboard" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Player</Text>
            <TextInput
              style={styles.input}
              placeholder="Player Name"
              placeholderTextColor={Colors.textSecondary}
              value={newPlayer}
              onChangeText={setNewPlayer}
            />
            <TextInput
              style={styles.input}
              placeholder="Wins Count"
              placeholderTextColor={Colors.textSecondary}
              value={newWins}
              onChangeText={setNewWins}
              keyboardType="numeric"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
              {GAME_OPTIONS.map((g) => (
                <Pressable
                  key={g}
                  style={[styles.gameChip, newGame === g && styles.gameChipActive]}
                  onPress={() => setNewGame(g)}
                >
                  <Text style={[styles.gameChipText, newGame === g && styles.gameChipTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]} onPress={addPlayer}>
              <Ionicons name="add-circle" size={18} color={Colors.bgPrimary} />
              <Text style={styles.addBtnText}>Add Player</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Current Players</Text>
            {(leaderboard || []).map((entry: any) => (
              <View key={entry.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{entry.playerName}</Text>
                  <Text style={styles.listItemSub}>{entry.winsCount} wins - {entry.game}</Text>
                </View>
                <Pressable onPress={() => deletePlayer(entry.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash" size={16} color={Colors.statusRed} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { paddingHorizontal: 20 },
  loginWrap: { flex: 1, alignItems: "center", paddingHorizontal: 40 },
  lockWrap: {
    width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center",
    backgroundColor: `${Colors.gold}10`, marginBottom: 20,
  },
  loginTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary, marginBottom: 6 },
  loginSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginBottom: 30 },
  loginBtn: {
    width: "100%", borderRadius: 14, paddingVertical: 15, alignItems: "center",
    overflow: "hidden",
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.bgPrimary },
  adminHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
  },
  adminTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  sectionBar: { gap: 8, marginBottom: 20, paddingBottom: 4 },
  sectionChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.bgCardBorder,
  },
  sectionChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  sectionChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  sectionChipTextActive: { color: Colors.bgPrimary },
  section: {},
  sectionTitle: {
    fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary, marginBottom: 14,
  },
  input: {
    backgroundColor: Colors.bgSurface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.bgCardBorder, marginBottom: 10,
  },
  inputMulti: { height: 100, textAlignVertical: "top" as const },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14,
  },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.bgPrimary },
  rushOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.bgCardBorder,
    marginBottom: 8,
  },
  rushDot: { width: 12, height: 12, borderRadius: 6 },
  rushOptionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  listItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  listItemTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  listItemSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: `${Colors.statusRed}10`,
  },
  gameChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.bgCardBorder,
  },
  gameChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  gameChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  gameChipTextActive: { color: Colors.bgPrimary },
});
