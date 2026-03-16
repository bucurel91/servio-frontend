import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo / illustration placeholder */}
        <View className="w-24 h-24 rounded-2xl bg-primary items-center justify-center mb-8">
          <Text className="text-white text-4xl font-bold">S</Text>
        </View>

        <Text className="text-3xl font-bold text-gray-900 text-center mb-3">
          Servio
        </Text>
        <Text className="text-base text-muted text-center mb-12 leading-6">
          Găsește cel mai bun service auto din Moldova. Rapid, simplu, de
          încredere.
        </Text>

        <TouchableOpacity
          className="w-full bg-primary rounded-xl py-4 items-center mb-4"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-white font-semibold text-base">Autentificare</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full border border-primary rounded-xl py-4 items-center"
          onPress={() => router.push("/(auth)/register")}
        >
          <Text className="text-primary font-semibold text-base">
            Înregistrare
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
