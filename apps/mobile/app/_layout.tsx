import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
import { onAuthStateChanged } from "firebase/auth";
import Constants from "expo-constants";
import { firebaseAuth, isFirebaseConfigured } from "../lib/firebase";
import { authApi, setTokenProvider, setBaseUrl } from "@servio/api";
import { useAuthStore } from "../store/auth";

export default function RootLayout() {
  const { setUser, setLoading, setAuthError } = useAuthStore();

  useEffect(() => {
    const extra = Constants.expoConfig?.extra ?? {};
    if (extra.apiUrl) {
      setBaseUrl(extra.apiUrl);
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setTokenProvider(async () => {
      const currentUser = firebaseAuth?.currentUser;
      if (!currentUser) return null;
      return currentUser.getIdToken();
    });

    const unsub = onAuthStateChanged(firebaseAuth!, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Login/register screens already fetched the backend user — skip duplicate call
      const alreadyLoaded = useAuthStore.getState().user;
      if (alreadyLoaded) {
        setLoading(false);
        return;
      }

      // Only reaches here for persisted sessions on app startup
      try {
        const me = await authApi.me();
        setAuthError(null);
        setUser(me as any);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 404) {
          setUser(null);
        } else {
          setUser(null);
          setAuthError("Nu s-a putut conecta la server. Verifică conexiunea.");
        }
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(service)" />
      </Stack>
    </QueryClientProvider>
  );
}
