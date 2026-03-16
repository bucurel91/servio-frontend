import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ServicesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold text-gray-900">Service-uri auto</Text>
        <Text className="text-muted mt-2">În curând...</Text>
      </View>
    </SafeAreaView>
  );
}
