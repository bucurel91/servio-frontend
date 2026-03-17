import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthBackground } from "../../components/AuthBackground";
import { firebaseAuth, isFirebaseConfigured } from "../../lib/firebase";
import { authApi } from "@servio/api";
import { useAuthStore } from "../../store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError("Completează email-ul și parola.");
      return;
    }
    if (!isFirebaseConfigured) {
      setError("Firebase nu este configurat. Completează fișierul .env.local cu cheile proiectului.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth!, email.trim(), password);
      try {
        const me = await authApi.me();
        setUser(me as any);
        router.replace("/");
      } catch (backendErr: any) {
        const status = backendErr?.response?.status;
        if (status === 401 || status === 404) {
          setError("Contul nu a fost găsit. Înregistrează-te mai întâi.");
        } else {
          setError("Serverul este indisponibil. Încearcă mai târziu.");
        }
      }
    } catch (err: any) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Email sau parolă incorectă."
          : "A apărut o eroare. Încearcă din nou."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground>
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-6 pt-8">
          <TouchableOpacity className="mb-8" onPress={() => router.back()}>
            <Text className="text-primary text-base">← Înapoi</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Bun venit înapoi
          </Text>
          <Text className="text-muted mb-8">
            Autentifică-te în contul tău Servio.
          </Text>

          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4 bg-white"
            placeholder="email@exemplu.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Parolă</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4 bg-white"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className="w-full bg-primary rounded-xl py-4 items-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Autentificare
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted">Nu ai cont? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="text-primary font-medium">Înregistrează-te</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AuthBackground>
  );
}
