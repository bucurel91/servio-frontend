import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { reviewsApi } from "@servio/api";
import { AuthBackground } from "../../../components/AuthBackground";

type SortOption = "newest" | "oldest" | "highest" | "lowest";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "newest", label: "Cele mai noi" },
  { key: "oldest", label: "Cele mai vechi" },
  { key: "highest", label: "Rating ↑" },
  { key: "lowest", label: "Rating ↓" },
];

export default function AllReviewsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [ratingDropdownVisible, setRatingDropdownVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reviews-all", userId],
    queryFn: () => reviewsApi.getByService(Number(userId), { size: 500 }),
    enabled: !!userId,
  });

  const allReviews = data?.content ?? [];

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: allReviews.filter((rv) => rv.rating === r).length,
  }));

  // Filter + sort
  const filtered = allReviews
    .filter((rv) => ratingFilter === null || rv.rating === ratingFilter)
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "highest") return b.rating - a.rating;
      return a.rating - b.rating;
    });

  const avgRating = allReviews.length
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : null;

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#1e3a5f" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f" }}>
            Toate recenziile
          </Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Summary card */}
            {allReviews.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" }}>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {/* Big rating */}
                  <View style={{ alignItems: "center", justifyContent: "center", minWidth: 64 }}>
                    <Text style={{ fontSize: 40, fontWeight: "800", color: "#1e3a5f" }}>{avgRating}</Text>
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name={s <= Math.round(Number(avgRating)) ? "star" : "star-outline"} size={14} color="#F59E0B" />
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{allReviews.length} recenzii</Text>
                  </View>
                  {/* Bar chart */}
                  <View style={{ flex: 1, gap: 5 }}>
                    {dist.map(({ rating, count }) => {
                      const pct = allReviews.length ? count / allReviews.length : 0;
                      return (
                        <TouchableOpacity
                          key={rating}
                          onPress={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                        >
                          <Text style={{ fontSize: 12, color: "#6B7280", width: 14 }}>{rating}</Text>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <View style={{ flex: 1, height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                            <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: ratingFilter === rating ? "#2563EB" : "#F59E0B", borderRadius: 4 }} />
                          </View>
                          <Text style={{ fontSize: 12, color: "#9CA3AF", width: 20, textAlign: "right" }}>{count}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Sort + Rating filter row */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSort(opt.key)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: sort === opt.key ? "#2563EB" : "rgba(255,255,255,0.75)", borderWidth: 1, borderColor: sort === opt.key ? "#2563EB" : "rgba(255,255,255,0.9)" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: sort === opt.key ? "white" : "#6B7280" }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Rating dropdown button */}
              <TouchableOpacity
                onPress={() => setRatingDropdownVisible(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: ratingFilter !== null ? "#FEF3C7" : "rgba(255,255,255,0.75)", borderWidth: 1, borderColor: ratingFilter !== null ? "#F59E0B" : "rgba(255,255,255,0.9)" }}
              >
                <Ionicons name="star" size={13} color={ratingFilter !== null ? "#F59E0B" : "#9CA3AF"} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: ratingFilter !== null ? "#92400E" : "#6B7280" }}>
                  {ratingFilter !== null ? `${ratingFilter} stele` : "Rating"}
                </Text>
                <Ionicons name="chevron-down" size={13} color={ratingFilter !== null ? "#92400E" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>

            {/* Rating dropdown modal */}
            <Modal visible={ratingDropdownVisible} transparent animationType="fade" onRequestClose={() => setRatingDropdownVisible(false)}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} activeOpacity={1} onPress={() => setRatingDropdownVisible(false)}>
                <View style={{ position: "absolute", top: "35%", left: "50%", transform: [{ translateX: -100 }], width: 200, backgroundColor: "white", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
                  <TouchableOpacity
                    onPress={() => { setRatingFilter(null); setRatingDropdownVisible(false); }}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: ratingFilter === null ? "#EFF6FF" : "white" }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: ratingFilter === null ? "700" : "500", color: "#1e3a5f" }}>Toate</Text>
                    {ratingFilter === null && <Ionicons name="checkmark" size={16} color="#2563EB" />}
                  </TouchableOpacity>
                  {[5, 4, 3, 2, 1].map((r, i) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => { setRatingFilter(r); setRatingDropdownVisible(false); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: "#F3F4F6", backgroundColor: ratingFilter === r ? "#FEF3C7" : "white" }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name={s <= r ? "star" : "star-outline"} size={14} color="#F59E0B" />
                        ))}
                      </View>
                      {ratingFilter === r && <Ionicons name="checkmark" size={16} color="#F59E0B" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Count */}
            <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 10, paddingHorizontal: 16 }}>
              {filtered.length} {filtered.length === 1 ? "recenzie" : "recenzii"}
              {ratingFilter !== null ? ` cu ${ratingFilter} stele` : ""}
            </Text>

            {/* Reviews list */}
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {filtered.length === 0 ? (
                <View style={{ alignItems: "center", paddingTop: 32 }}>
                  <Ionicons name="chatbubble-outline" size={40} color="#9CA3AF" />
                  <Text style={{ color: "#6B7280", marginTop: 8 }}>Nicio recenzie pentru acest filtru.</Text>
                </View>
              ) : (
                filtered.map((review) => (
                  <View key={review.id} style={{ backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2563EB" }}>
                            {review.customerName?.[0]?.toUpperCase() ?? "?"}
                          </Text>
                        </View>
                        <Text style={{ fontWeight: "600", color: "#1e3a5f" }}>{review.customerName}</Text>
                      </View>
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
                ))
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </AuthBackground>
  );
}
