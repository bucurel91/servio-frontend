import { View, Text, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const PINS = [
  { px: 0.22, py: 0.20, size: 180 },
  { px: 0.50, py: 0.78, size: 150 },
  { px: 0.76, py: 0.16, size: 130 },
];

function MapDecoration({ width }: { width: number }) {
  const W = width - 40;
  const H = 215;

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
  const cp1x = width * 1.2;
  const cp1y = height * 0.22;
  const cp2x = width * -0.2;
  const cp2y = height * 0.78;
  const bluePath = `M ${topX},0 L ${width},0 L ${width},${height} L ${bottomX},${height} C ${cp2x},${cp2y} ${cp1x},${cp1y} ${topX},0 Z`;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF4E6" }}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={width} height={height}>
        <Path d={bluePath} fill="#EFF6FF" />
      </Svg>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 0, paddingBottom: 60, gap: 32 }}>

          {/* Logo + subtitle */}
          <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
            <Image
              source={require("../../assets/logo-servio.png")}
              style={{ width: width - 10, height: 140 }}
              resizeMode="contain"
            />
            <Text className="text-base text-muted text-center leading-6 font-bold" style={{ marginTop: -24 }}>
              Găsește cel mai bun service auto{"\n"}din Moldova.
            </Text>
          </View>

          {/* Map + tagline below it */}
          <View style={{ alignItems: "center", gap: 12 }}>
            <MapDecoration width={width} />
            <Text className="text-base text-muted text-center leading-6 font-bold" style={{ paddingHorizontal: 32 }}>
              Rapid, simplu, de încredere.
            </Text>
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
