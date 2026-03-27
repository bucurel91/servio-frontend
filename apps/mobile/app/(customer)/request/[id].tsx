import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, FlatList, Dimensions, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, apiClient } from "@servio/api";
import { Ionicons } from "@expo/vector-icons";
import { AuthBackground } from "../../../components/AuthBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function getImageUrl(path: string) {
  if (path.startsWith("http")) return path;
  const base = (apiClient.defaults.baseURL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${base}${path}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  OPEN:   { label: "Activă",  color: "#F59E0B", bg: "#FEF3C7", icon: "time-outline" },
  CLOSED: { label: "Închisă", color: "#6B7280", bg: "#F3F4F6", icon: "checkmark-circle-outline" },
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: req, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => requestsApi.getById(Number(id)),
  });

  const closeMutation = useMutation({
    mutationFn: () => requestsApi.close(Number(id)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["request", id], updated);
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests-all"] });
    },
  });

  function confirmClose() {
    if (Platform.OS === "web") {
      if (window.confirm("Ești sigur că vrei să închizi această cerere?")) closeMutation.mutate();
      return;
    }
    Alert.alert(
      "Închide cererea",
      "Ești sigur că vrei să închizi această cerere?",
      [
        { text: "Anulează", style: "cancel" },
        { text: "Închide", style: "destructive", onPress: () => closeMutation.mutate() },
      ]
    );
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

  if (!req) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#64748B" }}>Cererea nu a fost găsită.</Text>
        </SafeAreaView>
      </AuthBackground>
    );
  }

  const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.OPEN;

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: "#EFF3FA",
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color="#1e3a5f" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: "center", fontWeight: "700", fontSize: 17, color: "#1e3a5f" }}>
            Cerere #{req.id}
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>

          {/* Status badge + title */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 18,
            padding: 20, gap: 14,
            borderWidth: 1, borderColor: "rgba(147,197,253,0.4)",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1e3a5f", flex: 1, marginRight: 12 }}>
                {req.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: status.bg }}>
                <Ionicons name={status.icon} size={14} color={status.color} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: status.color }}>{status.label}</Text>
              </View>
            </View>

            {req.description ? (
              <Text style={{ color: "#64748B", fontSize: 14, lineHeight: 22 }}>{req.description}</Text>
            ) : null}

            <View style={{ height: 1, backgroundColor: "#EFF3FA" }} />

            {/* Meta */}
            <View style={{ gap: 10 }}>
              <MetaRow icon="calendar-outline" label="Creat la"
                value={new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(req.createdAt))} />
              {req.cityName && (
                <MetaRow icon="location-outline" label="Locație" value={`${req.cityName} · ${req.radiusKm} km rază`} />
              )}
              <MetaRow icon="notifications-outline" label="Service-uri notificate"
                value={req.notifiedServicesCount > 0 ? `${req.notifiedServicesCount} service-uri` : "Niciun service notificat"} />
              {req.category && (
                <MetaRow icon="construct-outline" label="Categorie" value={req.category.name} />
              )}
            </View>
          </View>

          {/* Car card */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 18,
            padding: 20, gap: 12,
            borderWidth: 1, borderColor: "rgba(147,197,253,0.4)",
          }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f" }}>Mașina</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="car" size={28} color="#2563EB" />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#1e3a5f" }}>
                  {req.car.brand} {req.car.model}
                </Text>
                <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                  {req.car.year}{req.car.engineType ? ` · ${req.car.engineType}` : ""}
                </Text>
                {req.car.vin ? (
                  <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, fontFamily: "monospace" }}>
                    VIN: {req.car.vin}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Photos */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 18,
            padding: 16, gap: 12,
            borderWidth: 1, borderColor: "rgba(147,197,253,0.4)",
          }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f" }}>
              Fotografii {req.photos.length > 0 ? `(${req.photos.length})` : ""}
            </Text>

            {req.photos.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="camera-outline" size={26} color="#CBD5E1" />
                </View>
                <Text style={{ fontSize: 13, color: "#94A3B8" }}>Nicio fotografie atașată</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 4 }}>
                  {req.photos.map((photo, index) => (
                    <TouchableOpacity
                      key={photo.id}
                      onPress={() => setLightboxIndex(index)}
                      activeOpacity={0.85}
                      style={{
                        width: 90, height: 90, borderRadius: 12, overflow: "hidden",
                        borderWidth: 1.5, borderColor: "rgba(147,197,253,0.5)",
                      }}
                    >
                      <Image
                        source={{ uri: getImageUrl(photo.url) }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Lightbox */}
          <Modal
            visible={lightboxIndex !== null}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setLightboxIndex(null)}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
              {/* Close button */}
              <TouchableOpacity
                onPress={() => setLightboxIndex(null)}
                style={{ position: "absolute", top: Platform.OS === "ios" ? 56 : 36, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>

              {/* Counter */}
              {req.photos.length > 1 && (
                <View style={{ position: "absolute", top: Platform.OS === "ios" ? 62 : 42, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
                    {(lightboxIndex ?? 0) + 1} / {req.photos.length}
                  </Text>
                </View>
              )}

              {/* Main image */}
              {lightboxIndex !== null && (
                <Image
                  source={{ uri: getImageUrl(req.photos[lightboxIndex].url) }}
                  style={{ width: SCREEN_W, height: SCREEN_H * 0.75 }}
                  resizeMode="contain"
                />
              )}

              {/* Prev / Next arrows */}
              {req.photos.length > 1 && (
                <>
                  <TouchableOpacity
                    onPress={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
                    style={{ position: "absolute", left: 12, padding: 10, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)" }}
                    disabled={lightboxIndex === 0}
                  >
                    <Ionicons name="chevron-back" size={26} color={lightboxIndex === 0 ? "rgba(255,255,255,0.3)" : "white"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLightboxIndex((i) => (i !== null && i < req.photos.length - 1 ? i + 1 : i))}
                    style={{ position: "absolute", right: 12, padding: 10, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.12)" }}
                    disabled={lightboxIndex === req.photos.length - 1}
                  >
                    <Ionicons name="chevron-forward" size={26} color={lightboxIndex === req.photos.length - 1 ? "rgba(255,255,255,0.3)" : "white"} />
                  </TouchableOpacity>
                </>
              )}

              {/* Thumbnail strip */}
              {req.photos.length > 1 && (
                <View style={{ position: "absolute", bottom: Platform.OS === "ios" ? 48 : 28, left: 0, right: 0 }}>
                  <FlatList
                    data={req.photos}
                    keyExtractor={(p) => String(p.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity onPress={() => setLightboxIndex(index)} activeOpacity={0.8}>
                        <Image
                          source={{ uri: getImageUrl(item.url) }}
                          style={{
                            width: 56, height: 56, borderRadius: 8,
                            borderWidth: 2,
                            borderColor: lightboxIndex === index ? "#60A5FA" : "rgba(255,255,255,0.25)",
                            opacity: lightboxIndex === index ? 1 : 0.55,
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </Modal>

          {/* Close button — only for OPEN requests */}
          {req.status === "OPEN" && (
            <TouchableOpacity
              onPress={confirmClose}
              disabled={closeMutation.isPending}
              style={{
                borderRadius: 14, paddingVertical: 15, alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.75)",
                borderWidth: 1.5, borderColor: "#EF4444",
              }}
            >
              {closeMutation.isPending
                ? <ActivityIndicator color="#EF4444" />
                : <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>Închide cererea</Text>
              }
            </TouchableOpacity>
          )}

        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}

function MetaRow({ icon, label, value }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={16} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "500" }}>{label}</Text>
        <Text style={{ fontSize: 14, color: "#1e3a5f", fontWeight: "600" }}>{value}</Text>
      </View>
    </View>
  );
}
