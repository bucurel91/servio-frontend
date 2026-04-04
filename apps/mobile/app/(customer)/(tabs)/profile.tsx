import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../../lib/firebase";
import { useAuthStore } from "../../../store/auth";
import { usersApi, attachmentsApi, apiClient } from "@servio/api";
import { AuthBackground } from "../../../components/AuthBackground";

function getAvatarUrl(path: string) {
  if (path.startsWith("http")) return path;
  const base = (apiClient.defaults.baseURL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${base}${path}`;
}

export default function ProfileScreen() {
  const { setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: usersApi.getMe,
  });

  function openEdit() {
    if (!user) return;
    setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" });
    setEditing(true);
  }

  const updateMutation = useMutation({
    mutationFn: () => usersApi.updateMe({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() || null }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setUser(updated);
      setEditing(false);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: { uri: string; type: string; name: string }) => attachmentsApi.uploadAvatar(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (Platform.OS === "web") {
        window.alert("Permite accesul la galerie pentru a schimba avatarul.");
      } else {
        Alert.alert("Permisiune necesară", "Permite accesul la galerie pentru a schimba avatarul.");
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const ext = mimeType.split("/")[1] ?? "jpg";

    if (Platform.OS === "web") {
      // On web, asset.uri is a blob: URL — fetch it to get a real Blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      avatarMutation.mutate(new File([blob], `avatar.${ext}`, { type: mimeType }) as any);
    } else {
      avatarMutation.mutate({ uri: asset.uri, type: mimeType, name: `avatar.${ext}` });
    }
  }

  async function handleLogout() {
    if (Platform.OS === "web") {
      if (!window.confirm("Ești sigur că vrei să te deconectezi?")) return;
      await signOut(firebaseAuth!);
      setUser(null);
      router.replace("/(auth)/welcome");
      return;
    }
    Alert.alert("Deconectare", "Ești sigur că vrei să te deconectezi?", [
      { text: "Anulează", style: "cancel" },
      {
        text: "Deconectare", style: "destructive", onPress: async () => {
          await signOut(firebaseAuth!);
          setUser(null);
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </SafeAreaView>
      </AuthBackground>
    );
  }

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#1e3a5f" }}>Profilul meu</Text>
            {!editing && (
              <TouchableOpacity
                onPress={openEdit}
                style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EFF6FF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 }}
              >
                <Ionicons name="pencil-outline" size={15} color="#2563EB" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#2563EB" }}>Editează</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar */}
          <View style={{ alignItems: "center", marginTop: 12, marginBottom: 24 }}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} disabled={avatarMutation.isPending}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#BFDBFE" }}>
                {avatarMutation.isPending ? (
                  <ActivityIndicator color="#2563EB" />
                ) : user.avatarUrl ? (
                  <Image
                    source={{ uri: getAvatarUrl(user.avatarUrl) }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                  />
                ) : (
                  <Text style={{ fontSize: 34, fontWeight: "700", color: "#2563EB" }}>{initials}</Text>
                )}
              </View>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "white" }}>
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={{ marginTop: 12, fontSize: 20, fontWeight: "700", color: "#1e3a5f" }}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{user.email}</Text>
          </View>

          {/* Info / Edit card */}
          <View style={{ marginHorizontal: 16, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)", gap: 16 }}>
            {editing ? (
              <>
                <Field label="Prenume" value={form.firstName} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} />
                <Field label="Nume" value={form.lastName} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} />
                <Field label="Telefon" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" placeholder="+373 XXX XXX XX" />

                {updateMutation.isError && (
                  <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>A apărut o eroare. Încearcă din nou.</Text>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => setEditing(false)}
                    style={{ flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "rgba(255,255,255,0.7)" }}
                  >
                    <Text style={{ fontWeight: "600", color: "#64748B" }}>Anulează</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    style={{ flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", backgroundColor: updateMutation.isPending ? "#93C5FD" : "#2563EB" }}
                  >
                    {updateMutation.isPending
                      ? <ActivityIndicator color="white" />
                      : <Text style={{ fontWeight: "700", color: "white" }}>Salvează</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <InfoRow icon="person-outline" label="Prenume" value={user.firstName} />
                <Divider />
                <InfoRow icon="person-outline" label="Nume" value={user.lastName} />
                <Divider />
                <InfoRow icon="mail-outline" label="Email" value={user.email} />
                <Divider />
                <InfoRow icon="call-outline" label="Telefon" value={user.phone ?? "Necompletat"} muted={!user.phone} />
                <Divider />
                <InfoRow
                  icon="calendar-outline"
                  label="Membru din"
                  value={new Intl.DateTimeFormat("ro-MD", { day: "numeric", month: "long", year: "numeric" }).format(new Date(user.createdAt))}
                />
              </>
            )}
          </View>

          {/* Logout */}
          {!editing && (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 14, paddingVertical: 15, alignItems: "center", backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1.5, borderColor: "#EF4444", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>Deconectare</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}

function InfoRow({ icon, label, value, muted }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={17} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: muted ? "#94A3B8" : "#1e3a5f", fontWeight: "500", marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)" }} />;
}

function Field({ label, value, onChangeText, keyboardType, placeholder }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "phone-pad";
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, color: "#64748B", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={{ backgroundColor: "#F8FAFF", borderRadius: 12, padding: 13, borderWidth: 1.5, borderColor: value ? "#2563EB" : "#E8EEFF", fontSize: 15, color: "#1e3a5f" }}
      />
    </View>
  );
}
