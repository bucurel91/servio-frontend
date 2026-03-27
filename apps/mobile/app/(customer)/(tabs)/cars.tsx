import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { carsApi, carMakesApi } from "@servio/api";
import { CarResponse } from "@servio/types";
import { Ionicons } from "@expo/vector-icons";
import { AuthBackground } from "../../../components/AuthBackground";
import { useRouter } from "expo-router";

const CURRENT_YEAR = new Date().getFullYear();
const EMPTY_FORM = { brand: "", model: "", year: "", engineType: "", vin: "" };

const BRAND_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FFE4E6", text: "#9F1239" },
  { bg: "#CCFBF1", text: "#0F766E" },
  { bg: "#E0F2FE", text: "#0369A1" },
];

export default function CarsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCar, setEditingCar] = useState<CarResponse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);

  // Picker state
  const [makePickerVisible, setMakePickerVisible] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: carsApi.getAll,
  });

  const { data: makes = [] } = useQuery({
    queryKey: ["car-makes"],
    queryFn: carMakesApi.getAll,
    enabled: modalVisible,
  });

  const { data: models = [], isFetching: loadingModels } = useQuery({
    queryKey: ["car-models", selectedMakeId],
    queryFn: () => carMakesApi.getModels(selectedMakeId!),
    enabled: !!selectedMakeId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof carsApi.create>[0]) => carsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cars"] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof carsApi.update>[1] }) =>
      carsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cars"] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: carsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars"] }),
    onError: () => {
      const msg = "Nu se poate șterge o mașină cu cereri active. Închide mai întâi toate cererile.";
      if (Platform.OS === "web") { window.alert(msg); return; }
      Alert.alert("Nu se poate șterge", msg);
    },
  });

  function openAdd() {
    setEditingCar(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSelectedMakeId(null);
    setModalVisible(true);
  }

  function openEdit(car: CarResponse) {
    setEditingCar(car);
    setForm({ brand: car.brand, model: car.model, year: String(car.year), engineType: car.engineType ?? "", vin: car.vin ?? "" });
    setErrors({});
    setSelectedMakeId(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCar(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSelectedMakeId(null);
    setMakeSearch("");
    setModelSearch("");
  }

  function validate() {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.brand.trim()) e.brand = "Marca este obligatorie";
    if (!form.model.trim()) e.model = "Modelul este obligatoriu";
    const y = parseInt(form.year);
    if (!form.year || isNaN(y) || y < 1900 || y > CURRENT_YEAR + 1)
      e.year = `Anul trebuie să fie între 1900 și ${CURRENT_YEAR + 1}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const payload = {
      brand: form.brand.trim(), model: form.model.trim(),
      year: parseInt(form.year), engineType: form.engineType.trim() || null, vin: form.vin.trim() || null,
    };
    if (editingCar) updateMutation.mutate({ id: editingCar.id, data: payload });
    else createMutation.mutate(payload);
  }

  function confirmDelete(car: CarResponse) {
    if (Platform.OS === "web") {
      if (window.confirm(`Ștergi ${car.brand} ${car.model}?`)) deleteMutation.mutate(car.id);
      return;
    }
    Alert.alert("Șterge mașina", `Ești sigur că vrei să ștergi ${car.brand} ${car.model}?`, [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: () => deleteMutation.mutate(car.id) },
    ]);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const filteredMakes = makeSearch ? makes.filter(m => m.name.toLowerCase().includes(makeSearch.toLowerCase())) : makes;
  const filteredModels = modelSearch ? models.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase())) : models;

  return (
    <AuthBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#1e3a5f" }}>Mașinile mele</Text>
          <TouchableOpacity onPress={openAdd} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
        ) : cars.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="car-outline" size={40} color="#2563EB" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f", textAlign: "center" }}>Nicio mașină adăugată</Text>
            <Text style={{ color: "#64748B", textAlign: "center", marginTop: 8, lineHeight: 22 }}>
              Adaugă mașina ta pentru a putea crea cereri de service.
            </Text>
            <TouchableOpacity onPress={openAdd} style={{ marginTop: 24, backgroundColor: "#2563EB", paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 }}>
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Adaugă mașină</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {cars.map((car) => (
              <TouchableOpacity
                key={car.id}
                onPress={() => router.push(`/(customer)/car/${car.id}` as any)}
                style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: "#E8EEFF", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="car" size={26} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#1e3a5f" }}>{car.brand} {car.model}</Text>
                    <Text style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>{car.year}{car.engineType ? ` · ${car.engineType}` : ""}</Text>
                    {car.vin ? <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>VIN: {car.vin}</Text> : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity onPress={() => openEdit(car)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="pencil" size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(car)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Add / Edit Modal */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <AuthBackground>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#EFF3FA" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f" }}>
                    {editingCar ? "Editează mașina" : "Adaugă mașină"}
                  </Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
                  {/* Brand picker */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Marcă</Text>
                      <Text style={{ color: "#EF4444", fontSize: 13 }}>*</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { setMakeSearch(""); setMakePickerVisible(true); }}
                      style={{ backgroundColor: "#F8FAFF", borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: errors.brand ? "#EF4444" : form.brand ? "#2563EB" : "#E8EEFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <Text style={{ fontSize: 15, color: form.brand ? "#1e3a5f" : "#94A3B8" }}>
                        {form.brand || "Selectează marca"}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    {errors.brand && <Text style={{ color: "#EF4444", fontSize: 12 }}>{errors.brand}</Text>}
                  </View>

                  {/* Model picker */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Model</Text>
                      <Text style={{ color: "#EF4444", fontSize: 13 }}>*</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { if (!selectedMakeId && !editingCar) return; setModelSearch(""); setModelPickerVisible(true); }}
                      style={{ backgroundColor: "#F8FAFF", borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: errors.model ? "#EF4444" : form.model ? "#2563EB" : "#E8EEFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", opacity: (!selectedMakeId && !form.brand) ? 0.5 : 1 }}
                    >
                      <Text style={{ fontSize: 15, color: form.model ? "#1e3a5f" : "#94A3B8" }}>
                        {loadingModels ? "Se încarcă..." : form.model || (form.brand ? "Selectează modelul" : "Alege mai întâi marca")}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    {errors.model && <Text style={{ color: "#EF4444", fontSize: 12 }}>{errors.model}</Text>}
                  </View>

                  {/* Year */}
                  <Field
                    label="An fabricație" required placeholder={`ex: ${CURRENT_YEAR - 5}`}
                    value={form.year} onChangeText={(v) => setForm(f => ({ ...f, year: v }))}
                    error={errors.year} keyboardType="numeric" maxLength={4}
                  />

                  {/* Engine type */}
                  <Field
                    label="Motor" placeholder="ex: 1.6 TDI, 2.0 TSI"
                    value={form.engineType} onChangeText={(v) => setForm(f => ({ ...f, engineType: v }))}
                    hint="opțional"
                  />

                  {/* VIN */}
                  <Field
                    label="VIN" placeholder="ex: WVWZZZ1KZAW123456"
                    value={form.vin} onChangeText={(v) => setForm(f => ({ ...f, vin: v }))}
                    hint="opțional" autoCapitalize="characters"
                  />

                  {(createMutation.isError || updateMutation.isError) && (
                    <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>A apărut o eroare. Încearcă din nou.</Text>
                  )}

                  <TouchableOpacity
                    onPress={handleSave} disabled={isSaving}
                    style={{ backgroundColor: isSaving ? "#93C5FD" : "#2563EB", paddingVertical: 15, borderRadius: 12, alignItems: "center", marginTop: 4 }}
                  >
                    {isSaving ? <ActivityIndicator color="white" /> : (
                      <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                        {editingCar ? "Salvează modificările" : "Adaugă mașina"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </SafeAreaView>
            </AuthBackground>
          </KeyboardAvoidingView>
        </Modal>

        {/* Make Picker Modal */}
        <Modal visible={makePickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMakePickerVisible(false)}>
          <AuthBackground>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#EFF3FA" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f" }}>Selectează marca</Text>
                <TouchableOpacity onPress={() => setMakePickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" }}>
                  <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                  <TextInput
                    value={makeSearch} onChangeText={setMakeSearch}
                    placeholder="Caută marcă..." placeholderTextColor="#9CA3AF"
                    style={{ flex: 1, fontSize: 15, color: "#1e3a5f" }}
                    autoFocus
                  />
                </View>
              </View>
              <FlatList
                data={filteredMakes}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
                renderItem={({ item }) => {
                  const selected = form.brand === item.name;
                  const color = BRAND_COLORS[item.name.charCodeAt(0) % BRAND_COLORS.length];
                  return (
                    <TouchableOpacity
                      onPress={() => { setForm(f => ({ ...f, brand: item.name, model: "" })); setSelectedMakeId(item.id); setMakePickerVisible(false); }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: selected ? "#EFF6FF" : "rgba(255,255,255,0.75)", borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: selected ? "#2563EB" : "rgba(255,255,255,0.9)" }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: color.text }}>{item.name[0]}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 15, color: "#1e3a5f", fontWeight: selected ? "700" : "500" }}>{item.name}</Text>
                      {selected && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </AuthBackground>
        </Modal>

        {/* Model Picker Modal */}
        <Modal visible={modelPickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModelPickerVisible(false)}>
          <AuthBackground>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#EFF3FA" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a5f" }}>Selectează modelul</Text>
                <TouchableOpacity onPress={() => setModelPickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" }}>
                  <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                  <TextInput
                    value={modelSearch} onChangeText={setModelSearch}
                    placeholder="Caută model..." placeholderTextColor="#9CA3AF"
                    style={{ flex: 1, fontSize: 15, color: "#1e3a5f" }}
                    autoFocus
                  />
                </View>
              </View>
              {loadingModels ? (
                <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={filteredModels}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
                  renderItem={({ item }) => {
                    const selected = form.model === item.name;
                    return (
                      <TouchableOpacity
                        onPress={() => { setForm(f => ({ ...f, model: item.name })); setModelPickerVisible(false); }}
                        style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: selected ? "#EFF6FF" : "rgba(255,255,255,0.75)", borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: selected ? "#2563EB" : "rgba(255,255,255,0.9)" }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="car-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={{ flex: 1, fontSize: 15, color: "#1e3a5f", fontWeight: selected ? "700" : "500" }}>{item.name}</Text>
                        {selected && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </SafeAreaView>
          </AuthBackground>
        </Modal>
      </SafeAreaView>
    </AuthBackground>
  );
}

function Field({ label, required, placeholder, value, onChangeText, error, hint, keyboardType, maxLength, autoCapitalize }: {
  label: string; required?: boolean; placeholder?: string; value: string;
  onChangeText: (v: string) => void; error?: string; hint?: string;
  keyboardType?: "default" | "numeric"; maxLength?: number;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>{label}</Text>
        {required && <Text style={{ color: "#EF4444", fontSize: 13 }}>*</Text>}
        {hint && <Text style={{ color: "#94A3B8", fontSize: 12 }}>({hint})</Text>}
      </View>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#94A3B8" keyboardType={keyboardType ?? "default"}
        maxLength={maxLength} autoCapitalize={autoCapitalize ?? "words"}
        style={{ backgroundColor: "#F8FAFF", borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: error ? "#EF4444" : value ? "#2563EB" : "#E8EEFF", fontSize: 15, color: "#1e3a5f" }}
      />
      {error && <Text style={{ color: "#EF4444", fontSize: 12 }}>{error}</Text>}
    </View>
  );
}
