import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { carsApi, requestsApi } from "@servio/api";
import { Ionicons } from "@expo/vector-icons";
import { AuthBackground } from "../../../components/AuthBackground";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:   { label: "Activă",   color: "#F59E0B", bg: "#FEF3C7" },
  CLOSED: { label: "Închisă",  color: "#6B7280", bg: "#F3F4F6" },
};

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: carsApi.getAll,
  });

  const { data: requestsPage } = useQuery({
    queryKey: ["my-requests-all"],
    queryFn: () => requestsApi.getMy({ size: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => carsApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      router.back();
    },
    onError: () => {
      const msg = "Nu se poate șterge o mașină cu cereri active. Închide mai întâi toate cererile.";
      if (Platform.OS === "web") { window.alert(msg); return; }
      Alert.alert("Nu se poate șterge", msg);
    },
  });

  const car = cars.find((c) => c.id === Number(id));
  const carRequests = (requestsPage?.content ?? []).filter(
    (r) => r.car.id === Number(id)
  );

  if (isLoading) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </SafeAreaView>
      </AuthBackground>
    );
  }

  if (!car) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#64748B" }}>Mașina nu a fost găsită.</Text>
        </SafeAreaView>
      </AuthBackground>
    );
  }

  const hasActiveRequests = carRequests.some((r) => r.status === "OPEN");

  function confirmDelete() {
    if (hasActiveRequests) {
      const msg = "Nu se poate șterge o mașină cu cereri active. Închide mai întâi toate cererile.";
      if (Platform.OS === "web") { window.alert(msg); return; }
      Alert.alert("Nu se poate șterge", msg);
      return;
    }
    if (Platform.OS === "web") {
      if (window.confirm(`Ștergi ${car!.brand} ${car!.model}?`)) deleteMutation.mutate();
      return;
    }
    Alert.alert(
      "Șterge mașina",
      `Ești sigur că vrei să ștergi ${car!.brand} ${car!.model}?`,
      [
        { text: "Anulează", style: "cancel" },
        { text: "Șterge", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  }

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
            {car.brand} {car.model}
          </Text>
          <TouchableOpacity onPress={confirmDelete} style={{ padding: 4 }} disabled={deleteMutation.isPending}>
            <Ionicons name="trash-outline" size={22} color={hasActiveRequests ? "#FCA5A5" : "#EF4444"} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>

          {/* Car info card */}
          <View style={{
            backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 18,
            padding: 20, gap: 16,
            borderWidth: 1, borderColor: "rgba(147,197,253,0.4)",
          }}>
            {/* Icon + title */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="car" size={34} color="#2563EB" />
              </View>
              <View>
                <Text style={{ fontSize: 22, fontWeight: "800", color: "#1e3a5f" }}>
                  {car.brand} {car.model}
                </Text>
                <Text style={{ fontSize: 15, color: "#64748B", marginTop: 2 }}>{car.year}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "#EFF3FA" }} />

            {/* Details */}
            <View style={{ gap: 12 }}>
              <DetailRow icon="speedometer-outline" label="An fabricație" value={String(car.year)} />
              {car.engineType && (
                <DetailRow icon="flame-outline" label="Motor" value={car.engineType} />
              )}
              {car.vin && (
                <DetailRow icon="barcode-outline" label="VIN" value={car.vin} mono />
              )}
            </View>
          </View>

          {/* Requests for this car — only shown when there are requests */}
          {carRequests.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#1e3a5f" }}>
              Cereri de reparații
            </Text>
            {(
              carRequests.map((req) => {
                const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.OPEN;
                return (
                  <View key={req.id} style={{
                    backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 14,
                    padding: 16, gap: 6,
                    borderWidth: 1, borderColor: "#E8EEFF",
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontWeight: "700", color: "#1e3a5f", fontSize: 15, flex: 1, marginRight: 8 }}>
                        {req.title}
                      </Text>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: status.bg }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: status.color }}>{status.label}</Text>
                      </View>
                    </View>
                    {req.description ? (
                      <Text style={{ color: "#64748B", fontSize: 13, lineHeight: 19 }} numberOfLines={2}>
                        {req.description}
                      </Text>
                    ) : null}
                    <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                      {new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(req.createdAt))}
                      {req.notifiedServicesCount > 0 ? `  ·  ${req.notifiedServicesCount} service-uri notificate` : ""}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}

function DetailRow({ icon, label, value, mono = false }: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "500" }}>{label}</Text>
        <Text style={{ fontSize: 15, color: "#1e3a5f", fontWeight: "600", fontFamily: mono ? "monospace" : undefined }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
