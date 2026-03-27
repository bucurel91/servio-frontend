import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { servicesApi } from "@servio/api";
import { AutoServiceProfileResponse } from "@servio/types";
import { AuthBackground } from "../../../components/AuthBackground";

const CATEGORY_ICONS: Record<string, string> = {
  "disc-brake": "🛞", "engine": "🔧", "gearbox": "⚙️",
  "car-suspension": "🚗", "circuit": "⚡", "car-body": "🚙",
};

function StarRating({ rating, count }: { rating: string | null; count: number }) {
  const r = rating ? parseFloat(rating) : 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(r) ? "star" : "star-outline"}
          size={13}
          color="#F59E0B"
        />
      ))}
      <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 2 }}>
        {r > 0 ? r.toFixed(1) : "—"} ({count})
      </Text>
    </View>
  );
}

function ServiceCard({ service, onPress }: { service: AutoServiceProfileResponse; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "rgba(255,255,255,0.75)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.9)",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        {/* Avatar placeholder */}
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name="build" size={22} color="#2563EB" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e3a5f" }}>
              {service.businessName}
            </Text>
            {service.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
            )}
          </View>

          <StarRating rating={service.averageRating} count={service.reviewCount} />

          {service.address && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
                {service.address}{service.cityName ? `, ${service.cityName}` : ""}
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>

      {/* Categories */}
      {service.serviceCategories.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {service.serviceCategories.slice(0, 4).map((cat) => (
            <View key={cat.id} style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: "#EFF6FF", borderRadius: 20,
              paddingHorizontal: 8, paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 11 }}>
                {CATEGORY_ICONS[cat.slug ?? ""] ?? "🔧"}
              </Text>
              <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "500" }}>
                {cat.name}
              </Text>
            </View>
          ))}
          {service.serviceCategories.length > 4 && (
            <View style={{
              backgroundColor: "#F3F4F6", borderRadius: 20,
              paddingHorizontal: 8, paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 11, color: "#6B7280" }}>
                +{service.serviceCategories.length - 4}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Working hours */}
      {service.workingHours && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
          <Ionicons name="time-outline" size={13} color="#0D9488" />
          <Text style={{ fontSize: 12, color: "#0D9488" }}>{service.workingHours}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ServicesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesApi.getAll({ size: 50 }),
  });

  const services = data?.content ?? [];

  const filtered = search.trim()
    ? services.filter((s) =>
        s.businessName.toLowerCase().includes(search.toLowerCase()) ||
        s.cityName?.toLowerCase().includes(search.toLowerCase()) ||
        s.serviceCategories.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      )
    : services;

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1e3a5f" }}>
            Service-uri auto
          </Text>

          {/* Search */}
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
            marginTop: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
          }}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Caută servicii, oraș, categorie..."
              placeholderTextColor="#9CA3AF"
              style={{ flex: 1, fontSize: 14, color: "#1e3a5f" }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : isError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
            <Text style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}>
              Nu s-au putut încărca serviciile.
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{ marginTop: 12, backgroundColor: "#2563EB", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Reîncearcă</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
                <Ionicons name="build-outline" size={48} color="#9CA3AF" />
                <Text style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}>
                  {search ? "Niciun serviciu găsit." : "Nu există servicii disponibile momentan."}
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>
                  {filtered.length} {filtered.length === 1 ? "serviciu găsit" : "servicii găsite"}
                </Text>
                {filtered.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onPress={() => router.push(`/service/${service.id}` as any)}
                  />
                ))}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </AuthBackground>
  );
}
