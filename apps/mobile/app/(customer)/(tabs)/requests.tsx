import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { requestsApi } from "@servio/api";
import { AuthBackground } from "../../../components/AuthBackground";
import type { RepairRequestDetailResponse } from "@servio/types";

const STATUS_CONFIG = {
  OPEN:   { label: "Activă",  color: "#F59E0B", bg: "#FEF3C7", icon: "time-outline" as const },
  CLOSED: { label: "Închisă", color: "#6B7280", bg: "#F3F4F6", icon: "checkmark-circle-outline" as const },
};

type FilterTab = "OPEN" | "CLOSED";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "OPEN",   label: "Active" },
  { key: "CLOSED", label: "Închise" },
];

function RequestCard({ req, onPress }: { req: RepairRequestDetailResponse; onPress: () => void }) {
  const s = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.OPEN;
  const date = new Intl.DateTimeFormat("ro-MD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(req.createdAt));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(147,197,253,0.35)",
        gap: 10,
      }}
    >
      {/* Top row: title + status badge */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f", flex: 1 }} numberOfLines={1}>
          {req.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: s.bg }}>
          <Ionicons name={s.icon} size={12} color={s.color} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: s.color }}>{s.label}</Text>
        </View>
      </View>

      {/* Car */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="car-outline" size={15} color="#64748B" />
        <Text style={{ fontSize: 13, color: "#64748B" }}>
          {req.car.brand} {req.car.model} · {req.car.year}
        </Text>
      </View>

      {/* Bottom row: category + date + photos count + chevron */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {req.category && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Ionicons name="construct-outline" size={11} color="#2563EB" />
            <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "600" }}>{req.category.name}</Text>
          </View>
        )}
        {req.photos.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Ionicons name="camera-outline" size={11} color="#64748B" />
            <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>{req.photos.length}</Text>
          </View>
        )}
        <Text style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{date}</Text>
        <Ionicons name="chevron-forward" size={15} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

export default function RequestsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("OPEN");

  const { data, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["my-requests-all"],
    queryFn: () => requestsApi.getMy({ size: 100 }),
  });

  const all = data?.content ?? [];
  const filtered = all.filter((r) => r.status === filter);

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1e3a5f" }}>Cereri</Text>
          <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            {all.length} {all.length === 1 ? "cerere" : "cereri"} totale
          </Text>
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
          {FILTER_TABS.map((tab) => {
            const count = all.filter((r) => r.status === tab.key).length;
            const active = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 5,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? "#2563EB" : "rgba(255,255,255,0.7)",
                  borderWidth: 1, borderColor: active ? "#2563EB" : "rgba(255,255,255,0.9)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "white" : "#6B7280" }}>
                  {tab.label}
                </Text>
                <View style={{
                  paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10,
                  backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "white" : "#6B7280" }}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : isError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
            <Text style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}>
              Nu s-au putut încărca cererile.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{ marginTop: 12, backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Reîncearcă</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
            }
            renderItem={({ item }) => (
              <RequestCard
                req={item}
                onPress={() => router.push(`/(customer)/request/${item.id}` as any)}
              />
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="document-text-outline" size={32} color="#CBD5E1" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#64748B" }}>
                  {filter === "OPEN" ? "Nu ai cereri active" : "Nu ai cereri închise"}
                </Text>
                {filter === "OPEN" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(customer)/post-request")}
                    style={{ backgroundColor: "#2563EB", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 }}
                  >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>Creează prima cerere</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </AuthBackground>
  );
}
