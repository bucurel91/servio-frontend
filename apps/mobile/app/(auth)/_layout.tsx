import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth";

export default function AuthLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    // Already authenticated — redirect to the correct home
    if (user.role === "AUTO_SERVICE") {
      router.replace("/(service)/requests");
    } else {
      router.replace("/(customer)/home");
    }
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
