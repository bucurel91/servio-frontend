import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthBackground } from "../../components/AuthBackground";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "../../lib/firebase";
import { authApi } from "@servio/api";
import { useAuthStore } from "../../store/auth";
import type { Role } from "@servio/types";

const ROLES: { label: string; value: Role; description: string }[] = [
  {
    label: "Client",
    value: "CUSTOMER",
    description: "Postez cereri de reparații și caut service-uri.",
  },
  {
    label: "Service Auto",
    value: "AUTO_SERVICE",
    description: "Primesc cereri de la clienți și îmi gestionez profilul.",
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError("Completează toate câmpurile obligatorii.");
      return;
    }
    if (password.length < 6) {
      setError("Parola trebuie să aibă cel puțin 6 caractere.");
      return;
    }
    if (!isFirebaseConfigured) {
      setError("Firebase nu este configurat. Completează fișierul .env.local cu cheile proiectului.");
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth!,
        email.trim(),
        password
      );
      let token: string;
      try {
        token = await credential.user.getIdToken();
        const user = await authApi.register({
          firebaseToken: token,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          role,
        });
        setUser(user as any);
        router.replace("/");
      } catch (backendErr: any) {
        // Backend failed — roll back the Firebase account so the user can retry
        await deleteUser(credential.user).catch(() => {});
        throw backendErr;
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Există deja un cont cu acest email.");
      } else if (err.code === "auth/weak-password") {
        setError("Parola este prea slabă. Alege una mai complexă.");
      } else {
        setError("A apărut o eroare. Încearcă din nou.");
      }
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
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <TouchableOpacity className="mt-8 mb-8" onPress={() => router.back()}>
            <Text className="text-primary text-base">← Înapoi</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Creează cont
          </Text>
          <Text className="text-muted mb-8">
            Completează datele pentru a începe.
          </Text>

          {/* Role selector */}
          <Text className="text-sm font-medium text-gray-700 mb-3">
            Tipul contului
          </Text>
          <View className="flex-row gap-3 mb-6">
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                className={`flex-1 border rounded-xl p-3 ${
                  role === r.value
                    ? "border-primary bg-white"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setRole(r.value)}
              >
                <Text
                  className={`font-semibold text-sm mb-1 ${
                    role === r.value ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {r.label}
                </Text>
                <Text className="text-xs text-muted leading-4">
                  {r.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Prenume *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-white"
                placeholder="Ion"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Nume *
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-white"
                placeholder="Popescu"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-1">Email *</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4 bg-white"
            placeholder="email@exemplu.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">
            Telefon (opțional)
          </Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4 bg-white"
            placeholder="+37369000000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Parolă *</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4 bg-white"
            placeholder="Minim 6 caractere"
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
            className="w-full bg-primary rounded-xl py-4 items-center mb-8"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Creează cont
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AuthBackground>
  );
}
