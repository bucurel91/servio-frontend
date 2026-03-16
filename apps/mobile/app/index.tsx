import { useEffect } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { colors } from "../lib/theme";
import { useAuthStore } from "../store/auth";
import { firebaseAuth } from "../lib/firebase";
import { authApi } from "@servio/api";

export default function Index() {
  const { user, isLoading, authError, setAuthError, setUser, setLoading } = useAuthStore();
  const router = useRouter();

  async function handleRetry() {
    const firebaseUser = firebaseAuth?.currentUser;
    if (!firebaseUser) {
      setAuthError(null);
      router.replace("/(auth)/welcome");
      return;
    }
    setAuthError(null);
    setLoading(true);
    try {
      const me = await authApi.me();
      setUser(me as any);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 404) {
        setUser(null);
      } else {
        setAuthError("Nu s-a putut conecta la server. Verifică conexiunea.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading || authError) return;

    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }

    if (user.role === "AUTO_SERVICE") {
      router.replace("/(service)/requests");
    } else {
      router.replace("/(customer)/home");
    }
  }, [user, isLoading, authError]);

  async function handleLogout() {
    await signOut(firebaseAuth!).catch(() => {});
    setUser(null);
    setAuthError(null);
  }

  if (authError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
          Eroare de conexiune
        </Text>
        <Text className="text-muted text-center mb-6">{authError}</Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-8 py-3 mb-3"
          onPress={handleRetry}
        >
          <Text className="text-white font-semibold">Încearcă din nou</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Text className="text-muted text-sm">Deconectare</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
