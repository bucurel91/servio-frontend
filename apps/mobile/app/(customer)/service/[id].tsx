import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { servicesApi, reviewsApi } from "@servio/api";
import { AuthBackground } from "../../../components/AuthBackground";

const CATEGORY_ICONS: Record<string, string> = {
  "disc-brake": "🛞", "engine": "🔧", "gearbox": "⚙️",
  "car-suspension": "🚗", "circuit": "⚡", "car-body": "🚙",
};

function StarRating({ rating }: { rating: string | null }) {
  const r = rating ? parseFloat(rating) : 0;
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons key={s} name={s <= Math.round(r) ? "star" : "star-outline"} size={16} color="#F59E0B" />
      ))}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon as any} size={18} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: "#1e3a5f", fontWeight: "500", marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: () => servicesApi.getById(Number(id)),
    enabled: !!id,
  });

  const { data: reviewsPage } = useQuery({
    queryKey: ["reviews", service?.userId],
    queryFn: () => reviewsApi.getByService(service!.userId, { size: 5 }),
    enabled: !!service?.userId,
  });

  const reviews = reviewsPage?.content ?? [];

  if (isLoading) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </SafeAreaView>
      </AuthBackground>
    );
  }

  if (!service) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#6B7280" }}>Serviciul nu a fost găsit.</Text>
        </SafeAreaView>
      </AuthBackground>
    );
  }

  const rating = service.averageRating ? parseFloat(service.averageRating) : 0;

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#1e3a5f" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: "#1e3a5f" }} numberOfLines={1}>
            {service.businessName}
          </Text>
          {service.isVerified && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ECFDF5", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Ionicons name="checkmark-circle" size={14} color="#0D9488" />
              <Text style={{ fontSize: 12, color: "#0D9488", fontWeight: "600" }}>Verificat</Text>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero card */}
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{
              backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20,
              padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
              shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 }, elevation: 3,
            }}>
              {/* Avatar + name */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Ionicons name="build" size={32} color="#2563EB" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#1e3a5f", textAlign: "center" }}>
                  {service.businessName}
                </Text>
                {/* Rating */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <StarRating rating={service.averageRating} />
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    {rating > 0 ? rating.toFixed(1) : "—"} · {service.reviewCount} recenzii
                  </Text>
                </View>
              </View>

              {/* Description */}
              {service.description && (
                <Text style={{ fontSize: 14, color: "#4B5563", lineHeight: 20, textAlign: "center", marginBottom: 16 }}>
                  {service.description}
                </Text>
              )}

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginBottom: 12 }} />

              {/* Info rows */}
              {service.address && (
                <InfoRow icon="location-outline" label="Adresă" value={`${service.address}${service.cityName ? `, ${service.cityName}` : ""}`} />
              )}
              {service.contactPhone && (
                <InfoRow icon="call-outline" label="Telefon" value={service.contactPhone} />
              )}
              {service.contactEmail && (
                <InfoRow icon="mail-outline" label="Email" value={service.contactEmail} />
              )}
              {service.workingHours && (
                <InfoRow icon="time-outline" label="Program" value={service.workingHours} />
              )}
              {service.coverageRadiusKm && (
                <InfoRow icon="radio-button-on-outline" label="Raza de acoperire" value={`${service.coverageRadiusKm} km`} />
              )}
            </View>
          </View>

          {/* Categories */}
          {service.serviceCategories.length > 0 && (
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e3a5f", marginBottom: 10 }}>
                Categorii de servicii
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {service.serviceCategories.map((cat) => (
                  <View key={cat.id} style={{
                    flexDirection: "row", alignItems: "center", gap: 6,
                    backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20,
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderWidth: 1, borderColor: "#DBEAFE",
                  }}>
                    <Text>{CATEGORY_ICONS[cat.slug ?? ""] ?? "🔧"}</Text>
                    <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: "500" }}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Specialized brands */}
          {service.specializedBrands.length > 0 && (
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e3a5f", marginBottom: 10 }}>
                Mărci specializate
              </Text>
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

          {/* Reviews */}
          <View style={{ marginHorizontal: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e3a5f", marginBottom: 10 }}>
              Recenzii ({service.reviewCount})
            </Text>

            {reviews.length === 0 ? (
              <View style={{
                backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 16, padding: 24,
                alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
              }}>
                <Ionicons name="chatbubble-outline" size={32} color="#9CA3AF" />
                <Text style={{ color: "#6B7280", marginTop: 8 }}>Nicio recenzie încă.</Text>
              </View>
            ) : (
              <>
                {reviews.map((review) => (
                  <View key={review.id} style={{
                    backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 16, padding: 16,
                    marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontWeight: "600", color: "#1e3a5f" }}>{review.customerName}</Text>
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name={s <= review.rating ? "star" : "star-outline"} size={13} color="#F59E0B" />
                        ))}
                      </View>
                    </View>
                    {review.comment && (
                      <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>{review.comment}</Text>
                    )}
                    <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
                      {new Intl.DateTimeFormat("ro-MD", { day: "numeric", month: "long", year: "numeric" }).format(new Date(review.createdAt))}
                    </Text>
                  </View>
                ))}
                {service.reviewCount > 5 && (
                  <TouchableOpacity
                    onPress={() => router.push(`/(customer)/service-reviews/${service.userId}` as any)}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                      backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 16, padding: 14,
                      borderWidth: 1, borderColor: "#DBEAFE",
                    }}
                  >
                    <Text style={{ color: "#2563EB", fontWeight: "600", fontSize: 14 }}>
                      Vezi toate {service.reviewCount} recenziile
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}
