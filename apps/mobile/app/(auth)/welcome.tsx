import { View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

const PINS = [
  { px: 0.22, py: 0.20, size: 180 },
  { px: 0.50, py: 0.78, size: 150 },
  { px: 0.76, py: 0.16, size: 130 },
];

function MapDecoration({ width }: { width: number }) {
  const W = width - 40;
  const H = 250;

  return (
    <View
      style={{
        width: W, height: H, borderRadius: 18, overflow: "hidden",
        borderWidth: 1.5, borderColor: "rgba(0,0,0,0.15)",
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 }, elevation: 10,
      }}
    >
      <Image
        source={require("../../assets/map.png")}
        style={{ width: W, height: H }}
        resizeMode="cover"
      />
      {PINS.map((pin, i) => (
        <Image
          key={i}
          source={require("../../assets/icon-logo.png")}
          style={{
            position: "absolute",
            left: W * pin.px - pin.size / 2,
            top: H * pin.py - pin.size / 2,
            width: pin.size,
            height: pin.size,
          }}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const topX = width;
  const bottomX = width * 0.02;
  const cp1x = width * 1.4;
  const cp1y = height * 0.20;
  const cp2x = width * -0.4;
  const cp2y = height * 0.80;
  const bluePath = `M ${topX},0 L ${width},0 L ${width},${height} L ${bottomX},${height} C ${cp2x},${cp2y} ${cp1x},${cp1y} ${topX},0 Z`;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF4E6" }}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={width} height={height}>
        <Path d={bluePath} fill="#EFF6FF" />
      </Svg>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 0, paddingBottom: 60, gap: 16 }}>

          {/* Logo + subtitle */}
          <View style={{ alignItems: "center", paddingHorizontal: 16, gap: 4 }}>
            <Image
              source={require("../../assets/logo-servio.png")}
              style={{ width: width - 10, height: 140, marginBottom: -24 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e3a5f", textAlign: "center" }}>
              Rapid, simplu, de încredere.
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7a99", textAlign: "center", lineHeight: 20 }}>
              Găsește cel mai potrivit service auto{"\n"}pentru tine.
            </Text>
          </View>

          {/* Map */}
          <MapDecoration width={width} />

          {/* Feature panel */}
          <View style={{ paddingHorizontal: 32, width: "100%" }}>
            <View style={{
              borderRadius: 14,
              shadowColor: "#7B6FC4", shadowOpacity: 0.18,
              shadowRadius: 16, shadowOffset: { width: 0, height: 5 },
              elevation: 6,
            }}>
              <LinearGradient
                colors={["rgba(185,225,255,0.35)", "rgba(185,195,245,0.3)", "rgba(200,175,240,0.28)"]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ borderRadius: 14, overflow: "hidden", paddingVertical: 6, paddingHorizontal: 16 }}
              >
                {/* Bubbles — top right: sparse */}
                <View style={{ position: "absolute", top: 5,  right: 12, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                <View style={{ position: "absolute", top: 10, right: 30, width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />

                {/* Bubbles — middle right: moderate */}
                <View style={{ position: "absolute", top: "33%", right: 8,  width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", top: "38%", right: 22, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                <View style={{ position: "absolute", top: "44%", right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ position: "absolute", top: "42%", right: 38, width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />

                {/* Bubbles — bottom right: dense */}
                <View style={{ position: "absolute", bottom: 4,  right: 6,  width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" }} />
                <View style={{ position: "absolute", bottom: 10, right: 18, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" }} />
                <View style={{ position: "absolute", bottom: 4,  right: 30, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ position: "absolute", bottom: 14, right: 8,  width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" }} />
                <View style={{ position: "absolute", bottom: 8,  right: 44, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 18, right: 22, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" }} />
                <View style={{ position: "absolute", bottom: 6,  right: 58, width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" }} />
                <View style={{ position: "absolute", bottom: 20, right: 40, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" }} />
                <View style={{ position: "absolute", bottom: 12, right: 68, width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <View style={{ position: "absolute", bottom: 24, right: 12, width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" }} />

                {[
                  "Descrie problema mașinii",
                  "Primește oferte de la service-uri",
                  "Alege cea mai bună opțiune",
                ].map((item, i, arr) => (
                  <View key={i}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#2EB88A", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="checkmark" size={14} color="white" />
                      </View>
                      <Text style={{ color: "#0f2a50", fontWeight: "700", fontSize: 14 }}>{item}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.4)" }} />
                    )}
                  </View>
                ))}
              </LinearGradient>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ width: "100%", paddingHorizontal: 32, gap: 16 }}>
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                className="w-full bg-primary rounded-xl py-4 items-center"
                onPress={() => router.push("/(auth)/login")}
              >
                <Text className="text-white font-semibold text-base">Autentificare</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full border border-primary rounded-xl py-4 items-center"
                onPress={() => router.push("/(auth)/register")}
              >
                <Text className="text-primary font-semibold text-base">Înregistrare</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
