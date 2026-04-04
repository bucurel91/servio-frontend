import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, Platform, Modal, FlatList, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { useAuthStore } from "../../store/auth";
import { servicesApi, categoriesApi, carMakesApi, attachmentsApi, apiClient } from "@servio/api";
import { AuthBackground } from "../../components/AuthBackground";

function getPhotoUrl(url: string) {
  if (url.startsWith("http")) return url;
  const base = (apiClient.defaults.baseURL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${base}${url}`;
}

const CATEGORY_ICONS: Record<string, string> = {
  "disc-brake": "🛞", "engine": "🔧", "gearbox": "⚙️",
  "car-suspension": "🚗", "circuit": "⚡", "car-body": "🚙",
};

function StarRating({ rating }: { rating: string }) {
  const r = parseFloat(rating) || 0;
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons key={s} name={s <= Math.round(r) ? "star" : "star-outline"} size={15} color="#F59E0B" />
      ))}
    </View>
  );
}

export default function ServiceProfileScreen() {
  const { user: authUser, setUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    description: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
    workingHours: "",
    coverageRadiusKm: "",
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);

  const { data: service, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-service"],
    queryFn: servicesApi.getMy,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
    enabled: editing,
  });

  const { data: carMakes = [] } = useQuery({
    queryKey: ["car-makes"],
    queryFn: carMakesApi.getAll,
    enabled: editing,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: { uri: string; type: string; name: string } | File) =>
      attachmentsApi.uploadServicePhoto(file as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-service"] }),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: { uri: string; type: string; name: string } | File) =>
      attachmentsApi.uploadAvatar(file as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-service"] }),
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
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      uploadAvatarMutation.mutate(new File([blob], `avatar.${ext}`, { type: mimeType }));
    } else {
      uploadAvatarMutation.mutate({ uri: asset.uri, type: mimeType, name: `avatar.${ext}` });
    }
  }

  const deletePhotoMutation = useMutation({
    mutationFn: (id: number) => attachmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-service"] }),
  });

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (Platform.OS === "web") {
        window.alert("Permite accesul la galerie pentru a adăuga o fotografie.");
      } else {
        Alert.alert("Permisiune necesară", "Permite accesul la galerie pentru a adăuga o fotografie.");
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const ext = mimeType.split("/")[1] ?? "jpg";
    if (Platform.OS === "web") {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      uploadPhotoMutation.mutate(new File([blob], `photo.${ext}`, { type: mimeType }));
    } else {
      uploadPhotoMutation.mutate({ uri: asset.uri, type: mimeType, name: `photo.${ext}` });
    }
  }

  function confirmDeletePhoto(id: number) {
    if (Platform.OS === "web") {
      if (window.confirm("Ștergi această fotografie?")) deletePhotoMutation.mutate(id);
    } else {
      Alert.alert("Șterge fotografia", "Ești sigur că vrei să ștergi această fotografie?", [
        { text: "Anulează", style: "cancel" },
        { text: "Șterge", style: "destructive", onPress: () => deletePhotoMutation.mutate(id) },
      ]);
    }
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      servicesApi.updateMy({
        businessName: form.businessName.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        workingHours: form.workingHours.trim() || null,
        coverageRadiusKm: form.coverageRadiusKm ? parseInt(form.coverageRadiusKm) : undefined,
        categoryIds: selectedCategoryIds,
        specializedBrands: brands,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-service"], updated);
      setEditing(false);
    },
  });

  function openEdit() {
    if (!service) return;
    setForm({
      businessName: service.businessName,
      description: service.description ?? "",
      address: service.address ?? "",
      contactPhone: service.contactPhone ?? "",
      contactEmail: service.contactEmail ?? "",
      workingHours: service.workingHours ?? "",
      coverageRadiusKm: service.coverageRadiusKm ? String(service.coverageRadiusKm) : "",
    });
    setSelectedCategoryIds(service.serviceCategories.map((c) => c.id));
    setBrands(service.specializedBrands);
    setEditing(true);
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
        text: "Deconectare",
        style: "destructive",
        onPress: async () => {
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

  if (isError || !service) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
          <Text style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}>
            Nu s-a putut încărca profilul.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{ marginTop: 12, backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Reîncearcă</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </AuthBackground>
    );
  }

  const rating = parseFloat(service.averageRating) || 0;
  const initials = service.businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
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

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Avatar + name */}
          <View style={{ alignItems: "center", marginTop: 12, marginBottom: 24 }}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadAvatarMutation.isPending} style={{ position: "relative" }}>
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
                borderWidth: 3, borderColor: "#BFDBFE", overflow: "hidden",
              }}>
                {uploadAvatarMutation.isPending ? (
                  <ActivityIndicator color="#2563EB" />
                ) : service.avatarUrl ? (
                  <Image source={{ uri: getPhotoUrl(service.avatarUrl) }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                ) : (
                  <Text style={{ fontSize: 32, fontWeight: "700", color: "#2563EB" }}>{initials}</Text>
                )}
              </View>
              <View style={{
                position: "absolute", bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: 13,
                backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center",
                borderWidth: 2, borderColor: "white",
              }}>
                <Ionicons name="camera" size={13} color="white" />
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e3a5f" }}>{service.businessName}</Text>
              {service.isVerified && <Ionicons name="checkmark-circle" size={20} color="#0D9488" />}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <StarRating rating={service.averageRating} />
              <Text style={{ fontSize: 13, color: "#64748B" }}>
                {rating > 0 ? rating.toFixed(1) : "—"} · {service.reviewCount} recenzii
              </Text>
            </View>
          </View>

          {/* ── VIEW MODE ── */}
          {!editing && (
            <>
              {/* Info card */}
              <View style={{
                marginHorizontal: 16,
                backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20,
                padding: 20, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)",
              }}>
                {service.description && (
                  <>
                    <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 20, marginBottom: 14 }}>
                      {service.description}
                    </Text>
                    <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginBottom: 14 }} />
                  </>
                )}
                {service.address && (
                  <InfoRow icon="location-outline" label="Adresă"
                    value={`${service.address}${service.cityName ? `, ${service.cityName}` : ""}`} />
                )}
                {service.contactPhone && (
                  <InfoRow icon="call-outline" label="Telefon" value={service.contactPhone} />
                )}
                {authUser?.email && (
                  <InfoRow icon="mail-outline" label="Email cont" value={authUser.email} />
                )}
                {service.contactEmail && (
                  <InfoRow icon="mail-outline" label="Email contact" value={service.contactEmail} />
                )}
                {service.workingHours && (
                  <InfoRow icon="time-outline" label="Program" value={service.workingHours} />
                )}
                {!!service.coverageRadiusKm && (
                  <InfoRow icon="radio-button-on-outline" label="Raza de acoperire" value={`${service.coverageRadiusKm} km`} />
                )}
                <InfoRow
                  icon="calendar-outline"
                  label="Activ din"
                  value={new Intl.DateTimeFormat("ro-MD", { day: "numeric", month: "long", year: "numeric" }).format(new Date(service.createdAt))}
                />
              </View>

              {/* Categories */}
              {service.serviceCategories.length > 0 && (
                <View style={{ marginHorizontal: 16, marginTop: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f", marginBottom: 10 }}>Categorii</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {service.serviceCategories.map((cat) => (
                      <View key={cat.id} style={{
                        flexDirection: "row", alignItems: "center", gap: 5,
                        backgroundColor: "#EFF6FF", borderRadius: 20,
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderWidth: 1, borderColor: "#DBEAFE",
                      }}>
                        <Text style={{ fontSize: 13 }}>{CATEGORY_ICONS[cat.slug ?? ""] ?? "🔧"}</Text>
                        <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: "500" }}>{cat.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Specialized brands */}
              {service.specializedBrands.length > 0 && (
                <View style={{ marginHorizontal: 16, marginTop: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f", marginBottom: 10 }}>Mărci specializate</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {service.specializedBrands.map((brand) => (
                      <View key={brand} style={{
                        backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20,
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderWidth: 1, borderColor: "#E5E7EB",
                      }}>
                        <Text style={{ fontSize: 13, color: "#1e3a5f", fontWeight: "500" }}>{brand}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Photos */}
              <View style={{ marginHorizontal: 16, marginTop: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f" }}>
                    Fotografii ({service.photos.length}/10)
                  </Text>
                  {service.photos.length < 10 && (
                    <TouchableOpacity
                      onPress={pickPhoto}
                      disabled={uploadPhotoMutation.isPending}
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EFF6FF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      {uploadPhotoMutation.isPending
                        ? <ActivityIndicator size="small" color="#2563EB" />
                        : <Ionicons name="add" size={16} color="#2563EB" />}
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#2563EB" }}>Adaugă</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {service.photos.length === 0 ? (
                  <TouchableOpacity
                    onPress={pickPhoto}
                    disabled={uploadPhotoMutation.isPending}
                    style={{
                      borderWidth: 1.5, borderColor: "#E2E8F0", borderStyle: "dashed",
                      borderRadius: 16, paddingVertical: 32, alignItems: "center", gap: 8,
                      backgroundColor: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {uploadPhotoMutation.isPending
                      ? <ActivityIndicator color="#2563EB" />
                      : (
                        <>
                          <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                          <Text style={{ fontSize: 13, color: "#9CA3AF" }}>Adaugă fotografii ale service-ului</Text>
                        </>
                      )}
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {service.photos.map((photo) => (
                      <View key={photo.id} style={{ position: "relative" }}>
                        <TouchableOpacity onPress={() => setPhotoViewUrl(getPhotoUrl(photo.url))}>
                          <Image
                            source={{ uri: getPhotoUrl(photo.url) }}
                            style={{ width: 100, height: 100, borderRadius: 12 }}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => confirmDeletePhoto(photo.id)}
                          disabled={deletePhotoMutation.isPending}
                          style={{
                            position: "absolute", top: 4, right: 4,
                            width: 22, height: 22, borderRadius: 11,
                            backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Ionicons name="close" size={13} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Logout */}
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  marginHorizontal: 16, marginTop: 24, borderRadius: 14, paddingVertical: 15,
                  alignItems: "center", backgroundColor: "rgba(255,255,255,0.75)",
                  borderWidth: 1.5, borderColor: "#EF4444",
                  flexDirection: "row", justifyContent: "center", gap: 8,
                }}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>Deconectare</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── EDIT MODE ── */}
          {editing && (
            <View style={{ marginHorizontal: 16, gap: 14 }}>
              {/* Account email — read-only */}
              {authUser?.email && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>
                    Email cont <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(nu se poate modifica)</Text>
                  </Text>
                  <View style={{ backgroundColor: "#F1F5F9", borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: "#E2E8F0" }}>
                    <Text style={{ fontSize: 15, color: "#64748B" }}>{authUser.email}</Text>
                  </View>
                </View>
              )}
              <Field
                label="Nume business" required
                value={form.businessName}
                onChangeText={(v) => setForm((f) => ({ ...f, businessName: v }))}
              />
              <Field
                label="Descriere" hint="opțional" multiline
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Spune câteva cuvinte despre service-ul tău..."
              />
              <Field
                label="Adresă" hint="opțional"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
              />
              <Field
                label="Telefon" hint="opțional" keyboardType="phone-pad"
                value={form.contactPhone}
                onChangeText={(v) => setForm((f) => ({ ...f, contactPhone: v }))}
                placeholder="+373 XXX XXX XX"
              />
              <Field
                label="Email contact" hint="opțional" keyboardType="email-address"
                value={form.contactEmail}
                onChangeText={(v) => setForm((f) => ({ ...f, contactEmail: v }))}
                placeholder="Email vizibil clienților"
              />
              <Field
                label="Program" hint="opțional"
                value={form.workingHours}
                onChangeText={(v) => setForm((f) => ({ ...f, workingHours: v }))}
                placeholder="ex: L-V 08:00-18:00, S 09:00-14:00"
              />
              <Field
                label="Raza de acoperire (km)" hint="opțional" keyboardType="numeric"
                value={form.coverageRadiusKm}
                onChangeText={(v) => setForm((f) => ({ ...f, coverageRadiusKm: v }))}
              />

              {/* Categories */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Categorii de servicii</Text>
                <TouchableOpacity
                  onPress={() => setCategoryModalVisible(true)}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#F8FAFF", borderRadius: 12, padding: 14,
                    borderWidth: 1.5, borderColor: selectedCategoryIds.length > 0 ? "#2563EB" : "#E8EEFF",
                  }}
                >
                  <Text style={{ fontSize: 14, color: selectedCategoryIds.length > 0 ? "#1e3a5f" : "#94A3B8" }}>
                    {selectedCategoryIds.length > 0
                      ? `${selectedCategoryIds.length} ${selectedCategoryIds.length === 1 ? "categorie selectată" : "categorii selectate"}`
                      : "Selectează categorii..."}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {selectedCategoryIds.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {categories.filter((c) => selectedCategoryIds.includes(c.id)).map((cat) => (
                      <View key={cat.id} style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: "#EFF6FF", borderRadius: 20,
                        paddingHorizontal: 10, paddingVertical: 4,
                      }}>
                        <Text style={{ fontSize: 12 }}>{CATEGORY_ICONS[cat.slug ?? ""] ?? "🔧"}</Text>
                        <Text style={{ fontSize: 12, color: "#2563EB", fontWeight: "500" }}>{cat.name}</Text>
                        <TouchableOpacity onPress={() => setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.id))}>
                          <Ionicons name="close-circle" size={15} color="#93C5FD" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Specialized brands */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>
                  Mărci specializate <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opțional)</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => { setBrandSearch(""); setBrandModalVisible(true); }}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#F8FAFF", borderRadius: 12, padding: 14,
                    borderWidth: 1.5, borderColor: brands.length > 0 ? "#2563EB" : "#E8EEFF",
                  }}
                >
                  <Text style={{ fontSize: 14, color: brands.length > 0 ? "#1e3a5f" : "#94A3B8" }}>
                    {brands.length > 0
                      ? `${brands.length} ${brands.length === 1 ? "marcă selectată" : "mărci selectate"}`
                      : "Selectează mărci..."}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {brands.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {brands.map((brand) => (
                      <View key={brand} style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20,
                        paddingHorizontal: 10, paddingVertical: 5,
                        borderWidth: 1, borderColor: "#E5E7EB",
                      }}>
                        <Text style={{ fontSize: 13, color: "#1e3a5f", fontWeight: "500" }}>{brand}</Text>
                        <TouchableOpacity onPress={() => setBrands((prev) => prev.filter((b) => b !== brand))}>
                          <Ionicons name="close-circle" size={15} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {updateMutation.isError && (
                <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>
                  A apărut o eroare. Încearcă din nou.
                </Text>
              )}

              {/* Save / Cancel */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  style={{ flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "rgba(255,255,255,0.7)" }}
                >
                  <Text style={{ fontWeight: "600", color: "#64748B" }}>Anulează</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !form.businessName.trim()}
                  style={{
                    flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center",
                    backgroundColor: (updateMutation.isPending || !form.businessName.trim()) ? "#93C5FD" : "#2563EB",
                  }}
                >
                  {updateMutation.isPending
                    ? <ActivityIndicator color="white" />
                    : <Text style={{ fontWeight: "700", color: "white" }}>Salvează</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Categories multi-select modal */}
        <Modal
          visible={categoryModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <AuthBackground>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 1, borderBottomColor: "#EFF3FA",
              }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f" }}>Selectează categorii</Text>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
                renderItem={({ item }) => {
                  const selected = selectedCategoryIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedCategoryIds((prev) =>
                          selected ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        )
                      }
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 12,
                        backgroundColor: selected ? "#EFF6FF" : "rgba(255,255,255,0.75)",
                        borderRadius: 14, padding: 14,
                        borderWidth: 1.5, borderColor: selected ? "#2563EB" : "rgba(255,255,255,0.9)",
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[item.slug ?? ""] ?? "🔧"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, color: "#1e3a5f", fontWeight: selected ? "700" : "500" }}>{item.name}</Text>
                        {item.description && (
                          <Text style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>{item.description}</Text>
                        )}
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </AuthBackground>
        </Modal>

        {/* Brand multi-select modal */}
        <Modal
          visible={brandModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setBrandModalVisible(false)}
        >
          <AuthBackground>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 20, paddingVertical: 16,
                borderBottomWidth: 1, borderBottomColor: "#EFF3FA",
              }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f" }}>Selectează mărci</Text>
                <TouchableOpacity onPress={() => setBrandModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 8,
                  backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 12,
                  paddingHorizontal: 12, paddingVertical: 10,
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
                }}>
                  <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                  <TextInput
                    value={brandSearch}
                    onChangeText={setBrandSearch}
                    placeholder="Caută marcă..."
                    placeholderTextColor="#9CA3AF"
                    style={{ flex: 1, fontSize: 15, color: "#1e3a5f" }}
                    autoFocus
                  />
                </View>
              </View>
              <FlatList
                data={carMakes.filter((m) =>
                  !brandSearch || m.name.toLowerCase().includes(brandSearch.toLowerCase())
                )}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
                renderItem={({ item }) => {
                  const selected = brands.includes(item.name);
                  return (
                    <TouchableOpacity
                      onPress={() =>
                        setBrands((prev) =>
                          selected ? prev.filter((b) => b !== item.name) : [...prev, item.name]
                        )
                      }
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 12,
                        backgroundColor: selected ? "#EFF6FF" : "rgba(255,255,255,0.75)",
                        borderRadius: 14, padding: 14,
                        borderWidth: 1.5, borderColor: selected ? "#2563EB" : "rgba(255,255,255,0.9)",
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#2563EB" }}>
                          {item.name[0]}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 15, color: "#1e3a5f", fontWeight: selected ? "700" : "500" }}>
                        {item.name}
                      </Text>
                      {selected && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </AuthBackground>
        </Modal>

        {/* Photo lightbox */}
        <Modal visible={!!photoViewUrl} transparent animationType="fade" onRequestClose={() => setPhotoViewUrl(null)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
            activeOpacity={1}
            onPress={() => setPhotoViewUrl(null)}
          >
            {photoViewUrl && (
              <Image
                source={{ uri: photoViewUrl }}
                style={{ width: "100%", height: "80%" }}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              onPress={() => setPhotoViewUrl(null)}
              style={{ position: "absolute", top: 52, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </AuthBackground>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon as any} size={17} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 14, color: "#1e3a5f", fontWeight: "500", marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function Field({
  label, required, hint, value, onChangeText, placeholder, keyboardType, multiline,
}: {
  label: string; required?: boolean; hint?: string; value: string;
  onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>{label}</Text>
        {required && <Text style={{ color: "#EF4444", fontSize: 13 }}>*</Text>}
        {hint && <Text style={{ color: "#94A3B8", fontSize: 12 }}>({hint})</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        style={{
          backgroundColor: "#F8FAFF", borderRadius: 12, padding: 14,
          borderWidth: 1.5, borderColor: value ? "#2563EB" : "#E8EEFF",
          fontSize: 15, color: "#1e3a5f",
          ...(multiline ? { minHeight: 100, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );
}
