import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { subscriptionApi } from "@servio/api";
import { SubscriptionPlan, SubscriptionStatus } from "@servio/types";
import { AuthBackground } from "../../components/AuthBackground";

// ─── Plan metadata ────────────────────────────────────────────────────────────

const PLAN_META: Record<SubscriptionPlan, { label: string; color: string; bg: string; border: string }> = {
  FREE:    { label: "Gratuit",  color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  PRO:     { label: "Pro",      color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  PREMIUM: { label: "Premium",  color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
};

const STATUS_META: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "Activ",    color: "#059669", bg: "#ECFDF5" },
  EXPIRED:   { label: "Expirat",  color: "#DC2626", bg: "#FEF2F2" },
  CANCELLED: { label: "Anulat",   color: "#D97706", bg: "#FFFBEB" },
};

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  FREE: [
    "Până la 10 cereri/lună",
    "Profil de bază",
    "Notificări push",
  ],
  PRO: [
    "Cereri nelimitate",
    "Profil verificat",
    "Notificări push prioritare",
    "Statistici de bază",
  ],
  PREMIUM: [
    "Cereri nelimitate",
    "Profil verificat + recomandat",
    "Notificări push prioritare",
    "Statistici avansate",
    "Suport dedicat",
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const { data: sub, isLoading, isError, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.getMy,
  });

  if (isLoading) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </SafeAreaView>
      </AuthBackground>
    );
  }

  if (isError || !sub) {
    return (
      <AuthBackground>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
          <Text style={{ color: "#6B7280", marginTop: 12, textAlign: "center" }}>
            Nu s-a putut încărca abonamentul.
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

  const plan = PLAN_META[sub.plan];
  const status = STATUS_META[sub.status];
  const usagePercent = sub.freeRequestsLimit > 0
    ? Math.min(sub.freeRequestsUsed / sub.freeRequestsLimit, 1)
    : 0;
  const usageColor = usagePercent >= 1 ? "#DC2626" : usagePercent >= 0.75 ? "#D97706" : "#2563EB";

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1e3a5f" }}>Abonament</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Current plan card */}
          <View style={{
            marginTop: 8,
            backgroundColor: plan.bg,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: plan.border,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: plan.color + "18", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="card" size={22} color={plan.color} />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "500" }}>Planul curent</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: plan.color }}>{plan.label}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: status.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: status.color }}>{status.label}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

            {/* Dates */}
            <View style={{ gap: 6 }}>
              <DateRow
                icon="calendar-outline"
                label="Activ din"
                value={formatDate(sub.startDate)}
              />
              {sub.endDate && (
                <DateRow
                  icon="time-outline"
                  label="Expiră la"
                  value={formatDate(sub.endDate)}
                />
              )}
            </View>

            {/* Free plan usage */}
            {sub.plan === "FREE" && (
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: "#4B5563", fontWeight: "500" }}>Cereri folosite luna aceasta</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: usageColor }}>
                    {sub.freeRequestsUsed} / {sub.freeRequestsLimit}
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                  <View style={{
                    height: 8,
                    width: `${usagePercent * 100}%`,
                    backgroundColor: usageColor,
                    borderRadius: 4,
                  }} />
                </View>
                {usagePercent >= 1 && (
                  <Text style={{ fontSize: 12, color: "#DC2626", marginTop: 6, fontWeight: "500" }}>
                    Ai atins limita pentru luna aceasta. Upgrade la Pro pentru cereri nelimitate.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Features of current plan */}
          <View style={{
            marginTop: 16,
            backgroundColor: "rgba(255,255,255,0.8)",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(147,197,253,0.4)",
          }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f", marginBottom: 14 }}>
              Ce include planul {plan.label}
            </Text>
            <View style={{ gap: 10 }}>
              {PLAN_FEATURES[sub.plan].map((feature) => (
                <View key={feature} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="checkmark-circle" size={18} color={plan.color} />
                  <Text style={{ fontSize: 14, color: "#374151" }}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Upgrade plans — only shown when not already on PREMIUM */}
          {sub.plan !== "PREMIUM" && (
            <>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f", marginTop: 24, marginBottom: 12 }}>
                Upgrade plan
              </Text>

              {sub.plan === "FREE" && (
                <PlanCard
                  plan="PRO"
                  current={false}
                  price="199 MDL/lună"
                />
              )}
              <PlanCard
                plan="PREMIUM"
                current={false}
                price="349 MDL/lună"
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon as any} size={14} color="#94A3B8" />
      <Text style={{ fontSize: 13, color: "#64748B" }}>{label}:</Text>
      <Text style={{ fontSize: 13, color: "#1e3a5f", fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function PlanCard({ plan, price }: { plan: SubscriptionPlan; current: boolean; price: string }) {
  const meta = PLAN_META[plan];
  const features = PLAN_FEATURES[plan];

  return (
    <View style={{
      backgroundColor: meta.bg,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1.5,
      borderColor: meta.border,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: meta.color }}>{meta.label}</Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e3a5f" }}>{price}</Text>
      </View>
      <View style={{ gap: 8, marginBottom: 16 }}>
        {features.map((f) => (
          <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="checkmark-circle" size={16} color={meta.color} />
            <Text style={{ fontSize: 13, color: "#374151" }}>{f}</Text>
          </View>
        ))}
      </View>
      <View style={{
        backgroundColor: meta.color,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
      }}>
        <Ionicons name="arrow-up-circle-outline" size={17} color="white" />
        <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
          Upgrade la {meta.label}
        </Text>
      </View>
    </View>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ro-MD", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
