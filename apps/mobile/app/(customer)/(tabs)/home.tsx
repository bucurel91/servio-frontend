import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { requestsApi, servicesApi } from "@servio/api";


const CARD: object = {
  backgroundColor: "rgba(255,255,255,0.88)",
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  borderColor: "rgba(200,220,255,0.45)",
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

function statusStyle(status: string): { label: string; color: string; iconName: "time-outline" | "checkmark-circle-outline"; iconBg: string } {
  if (status === "OPEN") return { label: "În așteptare", color: "#F59E0B", iconName: "time-outline", iconBg: "#FEF3C7" };
  return { label: "Închisă", color: "#6b7280", iconName: "checkmark-circle-outline", iconBg: "#F3F4F6" };
}

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const { data: requestsPage, isLoading: requestsLoading } = useQuery({
    queryKey: ["my-requests", "OPEN"],
    queryFn: () => requestsApi.getMy({ status: "OPEN", size: 5 }),
  });
  const activeRequests = requestsPage?.content ?? [];

  const { data: servicesPage } = useQuery({
    queryKey: ["services"],
    queryFn: () => servicesApi.getAll({ size: 50 }),
  });
  const nearbyServices = (servicesPage?.content ?? []).slice(0, 3);

  const topX = width;
  const bottomX = width * 0.02;
  const cp1x = width * 1.35;
  const cp1y = height * 0.20;
  const cp2x = width * -0.35;
  const cp2y = height * 0.80;
  const bluePath = `M ${topX},0 L ${width},0 L ${width},${height} L ${bottomX},${height} C ${cp2x},${cp2y} ${cp1x},${cp1y} ${topX},0 Z`;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF4E6" }}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={width} height={height}>
        <Path d={bluePath} fill="#EFF6FF" />
      </Svg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

          {/* Header */}
          <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 0 }}>
            <Image
              source={require("../../../assets/logo-servio.png")}
              style={{ width: 340, height: 125 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e3a5f", marginTop: -30 }}>
              Ai o problemă cu mașina?
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 22, marginTop: 8 }}>

            {/* Hero card */}
            <View style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(147,197,253,0.4)",
              shadowColor: "#7B6FC4",
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 5 },
              elevation: 5,
            }}>
              <LinearGradient
                colors={["rgba(185,225,255,0.35)", "rgba(185,195,245,0.3)", "rgba(200,175,240,0.28)"]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20, overflow: "hidden" }}
              >
              <View style={{ minHeight: 130 }}>
                <View style={{ position: "absolute", top: 5,  right: 60, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                <View style={{ position: "absolute", top: 12, right: 80, width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <View style={{ position: "absolute", top: 8,  right: 45, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" }} />
                <View style={{ position: "absolute", top: "35%", right: 55, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", top: "40%", right: 72, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                <View style={{ position: "absolute", top: "45%", right: 42, width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ position: "absolute", top: "38%", right: 90, width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <View style={{ position: "absolute", bottom: 4,  right: 50,  width: 7,  height: 7,  borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)"  }} />
                <View style={{ position: "absolute", bottom: 12, right: 65,  width: 5,  height: 5,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" }} />
                <View style={{ position: "absolute", bottom: 5,  right: 80,  width: 4,  height: 4,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)"  }} />
                <View style={{ position: "absolute", bottom: 16, right: 55,  width: 6,  height: 6,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)"  }} />
                <View style={{ position: "absolute", bottom: 8,  right: 95,  width: 5,  height: 5,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 20, right: 70,  width: 4,  height: 4,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 6,  right: 108, width: 3,  height: 3,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)"  }} />
                <View style={{ position: "absolute", bottom: 22, right: 88,  width: 5,  height: 5,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)"  }} />
                <View style={{ position: "absolute", bottom: 14, right: 118, width: 4,  height: 4,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <View style={{ position: "absolute", bottom: 2,  right: 5,  width: 8,  height: 8,  borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)"  }} />
                <View style={{ position: "absolute", bottom: 10, right: 18, width: 6,  height: 6,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" }} />
                <View style={{ position: "absolute", bottom: 20, right: 8,  width: 5,  height: 5,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)"  }} />
                <View style={{ position: "absolute", bottom: 4,  right: 30, width: 7,  height: 7,  borderRadius: 4, backgroundColor: "rgba(255,255,255,0.45)" }} />
                <View style={{ position: "absolute", bottom: 14, right: 24, width: 4,  height: 4,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)"  }} />
                <View style={{ position: "absolute", bottom: 26, right: 15, width: 5,  height: 5,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 6,  right: 42, width: 4,  height: 4,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 18, right: 38, width: 3,  height: 3,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)"  }} />
                <View style={{ position: "absolute", bottom: 30, right: 28, width: 6,  height: 6,  borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 8,  right: 55, width: 3,  height: 3,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)"  }} />
                <View style={{ position: "absolute", bottom: 22, right: 50, width: 4,  height: 4,  borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />

                <View style={{ paddingRight: 170 }}>
                  <Text style={{ fontSize: 19, fontWeight: "700", color: "#1e3a5f" }}>
                    Creează cerere
                  </Text>
                  <Text style={{ fontSize: 13, color: "#3b5f8a", marginTop: 6, lineHeight: 19 }}>
                    Primești răspunsuri de la service-uri din apropiere
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#2563EB",
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 22,
                      marginTop: 18,
                      alignSelf: "flex-start",
                    }}
                    onPress={() => router.push("/(customer)/post-request")}
                  >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>Creează cerere</Text>
                  </TouchableOpacity>
                </View>
                <View pointerEvents="none" style={{ position: "absolute", right: -70, bottom: -55, width: 330, height: 265 }}>
                  <Image
                    source={require("../../../assets/car.png")}
                    style={{ width: 330, height: 265 }}
                    resizeMode="contain"
                  />
                </View>
              </View>
              </LinearGradient>
            </View>

            {/* Cereri active */}
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#1e3a5f" }}>Cereri active</Text>
                <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/requests")}>
                  <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: "500" }}>Vezi toate {">"}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ gap: 10 }}>
                {requestsLoading && (
                  <ActivityIndicator color="#2563EB" style={{ marginVertical: 12 }} />
                )}

                {!requestsLoading && activeRequests.map((req) => {
                  const s = statusStyle(req.status);
                  return (
                    <TouchableOpacity key={req.id} style={{ ...CARD, flexDirection: "row", alignItems: "center", gap: 12 }} onPress={() => router.push(`/(customer)/request/${req.id}` as any)}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: s.iconBg, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={s.iconName} size={22} color={s.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e3a5f" }}>
                          {req.car.brand} {req.car.model}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.color }} />
                          <Text style={{ fontSize: 12, color: s.color, fontWeight: "500" }}>{s.label}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{req.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  );
                })}

                {!requestsLoading && activeRequests.length === 0 && (
                  <TouchableOpacity
                    style={{ ...CARD, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                    onPress={() => router.push("/(customer)/post-request")}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e3a5f" }}>Nu ai cereri active</Text>
                      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Creează una în câteva secunde</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Service-uri aproape */}
            {nearbyServices.length > 0 && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: "#1e3a5f" }}>Service-uri aproape</Text>
                  <TouchableOpacity onPress={() => router.push("/(customer)/(tabs)/services")}>
                    <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: "500" }}>Vezi toate {">"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 10 }}>
                  {nearbyServices.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={{ ...CARD, flexDirection: "row", alignItems: "center", gap: 12 }}
                      onPress={() => router.push(`/(customer)/service/${s.id}` as any)}
                      activeOpacity={0.85}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="construct-outline" size={22} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e3a5f" }}>{s.businessName}</Text>
                        {s.averageRating && (
                          <View style={{ flexDirection: "row", gap: 2, marginTop: 3 }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Ionicons key={i} name={i <= Math.round(parseFloat(s.averageRating!)) ? "star" : "star-outline"} size={12} color="#F59E0B" />
                            ))}
                            <Text style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>{parseFloat(s.averageRating).toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Quick actions */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{ ...CARD, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 }}
                onPress={() => router.push("/(customer)/(tabs)/cars")}
              >
                <Ionicons name="car-outline" size={20} color="#2563EB" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e3a5f" }}>Mașinile mele</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ ...CARD, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 }}
                onPress={() => router.push("/(customer)/(tabs)/services")}
              >
                <Ionicons name="build-outline" size={20} color="#2563EB" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e3a5f" }}>Vezi service-uri</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
