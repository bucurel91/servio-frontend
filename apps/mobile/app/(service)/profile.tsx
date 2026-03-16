import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { useAuthStore } from "../../store/auth";

export default function ServiceProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [confirming, setConfirming] = useState(false);

  async function handleLogout() {
    await signOut(firebaseAuth!);
    setUser(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          Profilul service-ului
        </Text>
        {user && (
          <Text className="text-muted mb-8">
            {user.firstName} {user.lastName}
          </Text>
        )}

        <View className="mt-auto mb-4">
          {confirming ? (
            <View className="border border-danger rounded-xl p-4">
              <Text className="text-gray-900 font-medium text-center mb-4">
                Ești sigur că vrei să te deconectezi?
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
                  onPress={() => setConfirming(false)}
                >
                  <Text className="text-gray-700 font-medium">Anulare</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-danger rounded-xl py-3 items-center"
                  onPress={handleLogout}
                >
                  <Text className="text-white font-medium">Deconectare</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              className="w-full border border-danger rounded-xl py-4 items-center"
              onPress={() => setConfirming(true)}
            >
              <Text className="text-danger font-semibold">Deconectare</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
