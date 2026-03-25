import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi } from "@servio/api";
import { Ionicons } from "@expo/vector-icons";
import { AuthBackground } from "../../../components/AuthBackground";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  OPEN:   { label: "Activă",  color: "#F59E0B", bg: "#FEF3C7", icon: "time-outline" },
  CLOSED: { label: "Închisă", color: "#6B7280", bg: "#F3F4F6", icon: "checkmark-circle-outline" },
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: req, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => requestsApi.getById(Number(id)),
  });

  const closeMutation = useMutation({
    mutationFn: () => requestsApi.close(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["request", id] });
    },
  });

  function confirmClose() {
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
