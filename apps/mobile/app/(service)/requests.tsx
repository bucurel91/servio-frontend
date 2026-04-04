import { useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, FlatList,
  RefreshControl, Modal, ScrollView, Image, Alert, Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { requestsApi, apiClient } from "@servio/api";
import { AuthBackground } from "../../components/AuthBackground";
import type { RepairRequestSummaryResponse, RepairRequestDetailResponse } from "@servio/types";

function getImageUrl(path: string) {
  if (path.startsWith("http")) return path;
  const base = (apiClient.defaults.baseURL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${base}${path}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ro-MD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

// ─── Request card ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  OPEN:     { label: "Deschisă",  color: "#16A34A", bg: "#DCFCE7" },
  CLOSED:   { label: "Închisă",   color: "#6B7280", bg: "#F3F4F6" },
  ACCEPTED: { label: "Acceptată", color: "#2563EB", bg: "#EFF6FF" },
};

function RequestCard({ req, onPress }: { req: RepairRequestSummaryResponse; onPress: () => void }) {
  const s = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OPEN;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: "rgba(255,255,255,0.82)",
        borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: "rgba(147,197,253,0.35)", gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f", flex: 1 }} numberOfLines={2}>
          {req.title}
        </Text>
        <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: s.color }}>{s.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="car-outline" size={14} color="#64748B" />
        <Text style={{ fontSize: 13, color: "#64748B" }}>
          {req.carBrand} {req.carModel} · {req.carYear}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="person-outline" size={14} color="#64748B" />
        <Text style={{ fontSize: 13, color: "#64748B" }}>{req.customerName}</Text>
        {req.cityName && (
          <>
            <Text style={{ color: "#CBD5E1" }}>·</Text>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={{ fontSize: 13, color: "#64748B" }}>
              {req.chisinauZoneName ? `${req.chisinauZoneName}, ${req.cityName}` : req.cityName}
            </Text>
          </>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {req.categoryName && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Ionicons name="construct-outline" size={11} color="#2563EB" />
            <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "600" }}>{req.categoryName}</Text>
          </View>
        )}
        {req.photoCount > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Ionicons name="camera-outline" size={11} color="#64748B" />
            <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>{req.photoCount}</Text>
          </View>
        )}
        <Text style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{formatDate(req.createdAt)}</Text>
        <Ionicons name="chevron-forward" size={15} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function DetailModal({
  requestId,
  onClose,
  onAccepted,
}: {
  requestId: number;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["request-detail", requestId],
    queryFn: () => requestsApi.viewDetail(requestId),
  });

  const acceptMutation = useMutation({
    mutationFn: () => requestsApi.accept(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-inbox"] });
      onAccepted();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "A apărut o eroare.";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Eroare", msg);
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => requestsApi.reject(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-inbox"] });
      onClose();
    },
  });

  function confirmAccept() {
    if (Platform.OS === "web") {
      if (window.confirm("Accepti această cerere?")) acceptMutation.mutate();
    } else {
      Alert.alert("Acceptă cererea", "Ești sigur că vrei să accepți această cerere?", [
        { text: "Anulează", style: "cancel" },
        { text: "Acceptă", onPress: () => acceptMutation.mutate() },
      ]);
    }
  }

  function confirmReject() {
    if (Platform.OS === "web") {
      if (window.confirm("Refuzi această cerere?")) rejectMutation.mutate();
    } else {
      Alert.alert("Refuză cererea", "Ești sigur că vrei să refuzi această cerere?", [
        { text: "Anulează", style: "cancel" },
        { text: "Refuză", style: "destructive", onPress: () => rejectMutation.mutate() },
      ]);
    }
  }

  const isOpen = detail?.status === "OPEN";

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <AuthBackground>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EFF3FA" }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#1e3a5f" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", fontWeight: "700", fontSize: 17, color: "#1e3a5f" }}>
              {isLoading ? "Se încarcă..." : `Cerere #${requestId}`}
            </Text>
            <View style={{ width: 30 }} />
          </View>

          {isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : isError || !detail ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
              <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
              <Text style={{ color: "#6B7280", marginTop: 12 }}>Nu s-a putut încărca cererea.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <DetailContent detail={detail} onPhotoPress={setPhotoUrl} />
            </ScrollView>
          )}

          {/* Accept / Reject footer */}
          {detail && isOpen && (
            <View style={{ flexDirection: "row", gap: 10, padding: 16, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: "#EFF3FA", backgroundColor: "rgba(255,255,255,0.95)" }}>
              <TouchableOpacity
                onPress={confirmReject}
                disabled={rejectMutation.isPending}
                style={{ flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#EF4444", backgroundColor: "white" }}
              >
                {rejectMutation.isPending
                  ? <ActivityIndicator size="small" color="#EF4444" />
                  : <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 15 }}>Refuză</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAccept}
                disabled={acceptMutation.isPending}
                style={{ flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#2563EB" }}
              >
                {acceptMutation.isPending
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Acceptă cererea</Text>}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>

        {/* Photo lightbox */}
        <Modal visible={!!photoUrl} transparent animationType="fade" onRequestClose={() => setPhotoUrl(null)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
            activeOpacity={1}
            onPress={() => setPhotoUrl(null)}
          >
            {photoUrl && <Image source={{ uri: photoUrl }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />}
            <TouchableOpacity
              onPress={() => setPhotoUrl(null)}
              style={{ position: "absolute", top: insets.top + 12, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
            >
              <Ionicons name="close" size={22} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </AuthBackground>
    </Modal>
  );
}

function DetailContent({ detail, onPhotoPress }: { detail: RepairRequestDetailResponse; onPhotoPress: (url: string) => void }) {
  return (
    <>
      {/* Title + description */}
      <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)" }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1e3a5f" }}>{detail.title}</Text>
        {detail.description
          ? <Text style={{ fontSize: 14, color: "#64748B", lineHeight: 22 }}>{detail.description}</Text>
          : <Text style={{ fontSize: 14, color: "#9CA3AF", fontStyle: "italic" }}>Fără descriere</Text>
        }
      </View>

      {/* Client info */}
      <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 20, gap: 10, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)" }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e3a5f", marginBottom: 4 }}>Client</Text>
        <MetaRow icon="person-outline" label="Nume" value={detail.customerName} />
        {detail.customerPhone && (
          <MetaRow icon="call-outline" label="Telefon" value={detail.customerPhone} />
        )}
      </View>

      {/* Meta */}
      <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 20, gap: 10, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)" }}>
        {detail.cityName && (
          <MetaRow
            icon="location-outline"
            label="Locație"
            value={detail.chisinauZoneName ? `${detail.chisinauZoneName}, ${detail.cityName} · ${detail.radiusKm} km rază` : `${detail.cityName} · ${detail.radiusKm} km rază`}
          />
        )}
        {detail.category && <MetaRow icon="construct-outline" label="Categorie" value={detail.category.name} />}
        <MetaRow icon="calendar-outline" label="Postat la" value={formatDate(detail.createdAt)} />
        <MetaRow icon="notifications-outline" label="Service-uri notificate" value={`${detail.notifiedServicesCount}`} />
      </View>

      {/* Car */}
      <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)" }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e3a5f" }}>Mașina</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="car" size={24} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f" }}>{detail.car.brand} {detail.car.model}</Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              {detail.car.year}{detail.car.engineType ? ` · ${detail.car.engineType}` : ""}
            </Text>
            {detail.car.vin && <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>VIN: {detail.car.vin}</Text>}
          </View>
        </View>
      </View>

      {/* Photos */}
      {detail.photos.length > 0 && (
        <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: "rgba(147,197,253,0.4)" }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e3a5f" }}>Fotografii ({detail.photos.length})</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {detail.photos.map((p) => (
              <TouchableOpacity key={p.id} onPress={() => onPhotoPress(getImageUrl(p.url))}>
                <Image source={{ uri: getImageUrl(p.url) }} style={{ width: 100, height: 100, borderRadius: 12 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
      <Ionicons name={icon} size={15} color="#94A3B8" style={{ marginTop: 1 }} />
      <Text style={{ fontSize: 13, color: "#94A3B8", width: 110 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: "#1e3a5f", fontWeight: "600", flex: 1 }}>{value}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ServiceRequestsScreen() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["service-inbox"],
    queryFn: () => requestsApi.getServiceInbox({ size: 50 }),
  });

  const requests = data?.content ?? [];

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1e3a5f" }}>Cereri</Text>
          {!isLoading && !isError && (
            <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              {requests.length} {requests.length === 1 ? "cerere primită" : "cereri primite"}
            </Text>
          )}
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : isError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
            <Text style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}>Nu s-au putut încărca cererile.</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{ marginTop: 12, backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Reîncearcă</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563EB" />}
            renderItem={({ item }) => (
              <RequestCard req={item} onPress={() => setSelectedId(item.id)} />
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="document-text-outline" size={32} color="#CBD5E1" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#64748B" }}>Nu ai cereri primite</Text>
                <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
                  Vei vedea cererile când clienții din zona ta postează una.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {selectedId !== null && (
        <DetailModal
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onAccepted={() => setSelectedId(null)}
        />
      )}
    </AuthBackground>
  );
}
