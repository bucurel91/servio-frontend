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
              Găsește cel mai bun service auto{"\n"}din Moldova.
            </Text>
          </View>

          {/* Map */}
          <MapDecoration width={width} />

          {/* Premium feature panel */}
          <View style={{ paddingHorizontal: 40, gap: 10, width: "100%" }}>

            {/* Shadow wrapper */}
            <View style={{
              borderRadius: 24,
              shadowColor: "#4A7CC7",
              shadowOpacity: 0.12,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}>
              {/* Base gradient — soft blue to lavender */}
              <LinearGradient
                colors={["rgba(120, 170, 255, 0.42)", "rgba(165, 135, 255, 0.35)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, overflow: "hidden" }}
              >
                {/* Top-left gloss highlight */}
                <LinearGradient
                  colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.8, y: 0.6 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Inner white border for glass edge */}
                <View style={{
                  borderRadius: 23,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.7)",
                  paddingVertical: 2,
                  paddingHorizontal: 14,
                }}>
                  {[
                    "Programare rapidă și simplă",
                    "Găsește service-uri aproape de tine",
                    "Service-uri de încredere",
                  ].map((item, i, arr) => (
                    <View key={i}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 }}>
                        <View style={{
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: "#0D9488",
                          alignItems: "center", justifyContent: "center",
                          shadowColor: "#0D9488", shadowOpacity: 0.25,
                          shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
                        }}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                        <Text style={{ color: "#0f2a50", fontWeight: "700", fontSize: 13 }}>{item}</Text>
                      </View>
                      {i < arr.length - 1 && (
                        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.3)" }} />
                      )}
                    </View>
                  ))}
                </View>
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
