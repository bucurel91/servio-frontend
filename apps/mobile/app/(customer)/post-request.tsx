import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { carsApi, categoriesApi, locationsApi, requestsApi, attachmentsApi } from "@servio/api";
import { Ionicons } from "@expo/vector-icons";
import { AuthBackground } from "../../components/AuthBackground";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

async function photoToFile(photo: ImagePicker.ImagePickerAsset): Promise<Blob | { uri: string; type: string; name: string }> {
  if (Platform.OS === "web") {
    const res = await fetch(photo.uri);
    return res.blob();
  }
  return { uri: photo.uri, type: photo.mimeType ?? "image/jpeg", name: photo.fileName ?? "photo.jpg" };
}

const STEPS = ["Mașina", "Categoria", "Problema", "Locație"];
const RADIUS_OPTIONS = [5, 10, 25, 50];

const CATEGORY_ICON_MAP: Record<string, string> = {
  "disc-brake":      "🛞",
  "engine":          "🔧",
  "gearbox":         "⚙️",
  "car-suspension":  "🚗",
  "circuit":         "⚡",
  "car-body":        "🚙",
  "tires":           "🔩",
  "ac":              "❄️",
  "exhaust":         "💨",
  "oil":             "🫙",
  "diagnostics":     "🔍",
};

function categoryIcon(icon: string | null): string {
  if (!icon) return "🔧";
  return CATEGORY_ICON_MAP[icon] ?? "🔧";
}

export default function PostRequestScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [carId, setCarId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);
  const [chisinauZoneId, setChisinauZoneId] = useState<number | null>(null);

  // GPS location state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [gpsCityName, setGpsCityName] = useState<string | null>(null);

  const { data: cars = [], isLoading: carsLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: carsApi.getAll,
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: locationsApi.getRegions,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedRegionId],
    queryFn: () => locationsApi.getCitiesByRegion(selectedRegionId!),
    enabled: !!selectedRegionId,
  });

  const { data: chisinauZones = [] } = useQuery({
    queryKey: ["chisinau-zones"],
    queryFn: locationsApi.getChisinauZones,
  });

  const mutation = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: async (created) => {
      // Upload photos after request is created
      await Promise.allSettled(
        photos.map(async (photo) => {
          const file = await photoToFile(photo);
          return attachmentsApi.uploadRequestPhoto(created.id, file as any);
        })
      );
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests-all"] });
      router.back();
    },
  });

  async function pickPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setPhotos((prev) => {
        const combined = [...prev, ...result.assets];
        return combined.slice(0, 5);
      });
    }
  }

  // Auto-detect location when reaching step 3
  useEffect(() => {
    if (step !== 3 || locationLabel || showManualPicker) return;
    detectLocation();
  }, [step]);

  // Auto-select city once cities load after GPS detection
  useEffect(() => {
    if (!gpsCityName || cities.length === 0 || cityId) return;
    const match = cities.find(c =>
      c.name.toLowerCase().includes(gpsCityName.toLowerCase()) ||
      gpsCityName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (match) setCityId(match.id);
  }, [cities, gpsCityName]);

  async function detectLocation() {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setShowManualPicker(true); return; }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const city = geo.city ?? geo.subregion ?? null;
      const region = geo.region ?? null;

      if (city) {
        setGpsCityName(city);
        setLocationLabel(city);
        if (region && regions.length > 0) {
          const regionMatch = regions.find(r =>
            r.name.toLowerCase().includes(region.toLowerCase()) ||
            region.toLowerCase().includes(r.name.replace("Raionul ", "").replace("Municipiul ", "").toLowerCase())
          );
          if (regionMatch) setSelectedRegionId(regionMatch.id);
        }
      } else {
        setShowManualPicker(true);
      }
    } catch {
      setShowManualPicker(true);
    } finally {
      setLocationLoading(false);
    }
  }

  const canNext = () => {
    if (step === 0) return !!carId;
    if (step === 1) return !!categoryId;
    if (step === 2) return title.trim().length > 0 && description.trim().length > 0;
    if (step === 3) return !!cityId;
    return true;
  };

  const handleSubmit = () => {
    if (!carId || !categoryId || !cityId) return;
    mutation.mutate({
      carId,
      categoryId,
      cityId,
      title: title.trim(),
      description: description.trim(),
      radiusKm,
    });
  };

  return (
    <AuthBackground>
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#EFF3FA",
      }}>
        <TouchableOpacity
          onPress={() => step > 0 ? setStep(step - 1) : router.back()}
          style={{ padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1e3a5f" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: "center", fontWeight: "700", fontSize: 17, color: "#1e3a5f" }}>
          Cerere nouă
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Step progress */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 6 }}>
        {STEPS.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <View style={{
              height: 4, borderRadius: 2, width: "100%",
              backgroundColor: i <= step ? "#2563EB" : "#DDE6FF",
            }} />
            <Text style={{ fontSize: 10, marginTop: 4, color: i <= step ? "#2563EB" : "#94A3B8", fontWeight: i === step ? "700" : "400" }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>

        {/* ── STEP 0: Car ── */}
        {step === 0 && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e3a5f" }}>Ce mașină ai?</Text>
              <Text style={{ color: "#64748B", fontSize: 14 }}>Selectează mașina pentru care cauți service</Text>
            </View>

            {carsLoading ? (
              <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
            ) : cars.length === 0 ? (
              <View style={{ alignItems: "center", padding: 32, backgroundColor: "white", borderRadius: 16, borderWidth: 1.5, borderColor: "#E8EEFF" }}>
                <Ionicons name="car-outline" size={48} color="#94A3B8" />
                <Text style={{ color: "#64748B", marginTop: 10, textAlign: "center", lineHeight: 22 }}>
                  Nu ai nicio mașină adăugată.{"\n"}Adaugă o mașină din secțiunea Mașinile mele.
                </Text>
              </View>
            ) : (
              cars.map((car) => (
                <TouchableOpacity
                  key={car.id}
                  onPress={() => setCarId(car.id)}
                  style={{
                    flexDirection: "row", alignItems: "center", padding: 16,
                    backgroundColor: "white", borderRadius: 14,
                    borderWidth: 2, borderColor: carId === car.id ? "#2563EB" : "#E8EEFF",
                    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 }, elevation: 2,
                  }}
                >
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="car" size={24} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: "700", color: "#1e3a5f", fontSize: 15 }}>
                      {car.brand} {car.model}
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>
                      {car.year}{car.engineType ? ` · ${car.engineType}` : ""}
                    </Text>
                  </View>
                  {carId === car.id && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── STEP 1: Category ── */}
        {step === 1 && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e3a5f" }}>Ce tip de service?</Text>
              <Text style={{ color: "#64748B", fontSize: 14 }}>Selectează categoria potrivită problemei tale</Text>
            </View>

            {catsLoading ? (
              <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
            ) : (
              categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={{
                    flexDirection: "row", alignItems: "center", padding: 16,
                    backgroundColor: "white", borderRadius: 14,
                    borderWidth: 2, borderColor: categoryId === cat.id ? "#2563EB" : "#E8EEFF",
                    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 }, elevation: 2,
                  }}
                >
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 22 }}>{categoryIcon(cat.icon)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 15 }}>{cat.name}</Text>
                    {cat.description ? (
                      <Text style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>{cat.description}</Text>
                    ) : null}
                  </View>
                  {categoryId === cat.id && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── STEP 2: Title + Description ── */}
        {step === 2 && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e3a5f" }}>Descrie problema</Text>
              <Text style={{ color: "#64748B", fontSize: 14 }}>Cu cât mai detaliat, cu atât mai bune ofertele</Text>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Titlu scurt</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="ex: Schimb plăcuțe frână față"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: "white", borderRadius: 12, padding: 14,
                  borderWidth: 1.5, borderColor: title.length > 0 ? "#2563EB" : "#E8EEFF",
                  fontSize: 15, color: "#1e3a5f",
                }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Descriere detaliată</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descrie simptomele, când apare problema, ce ai observat..."
                placeholderTextColor="#94A3B8"
                multiline
                style={{
                  backgroundColor: "white", borderRadius: 12, padding: 14,
                  borderWidth: 1.5, borderColor: description.length > 0 ? "#2563EB" : "#E8EEFF",
                  fontSize: 15, color: "#1e3a5f", minHeight: 140, textAlignVertical: "top",
                }}
              />
            </View>

            {/* Photos */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>
                  Fotografii <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opțional, max 5)</Text>
                </Text>
                {photos.length < 5 && (
                  <TouchableOpacity onPress={pickPhotos} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Ionicons name="add" size={16} color="#2563EB" />
                    <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: "600" }}>Adaugă</Text>
                  </TouchableOpacity>
                )}
              </View>

              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {photos.map((photo, i) => (
                    <View key={i} style={{ position: "relative" }}>
                      <Image source={{ uri: photo.uri }} style={{ width: 90, height: 90, borderRadius: 12, borderWidth: 1.5, borderColor: "#E8EEFF" }} />
                      <TouchableOpacity
                        onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" }}
                      >
                        <Ionicons name="close" size={13} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length < 5 && (
                    <TouchableOpacity
                      onPress={pickPhotos}
                      style={{ width: 90, height: 90, borderRadius: 12, borderWidth: 1.5, borderColor: "#E8EEFF", borderStyle: "dashed", backgroundColor: "#F8FAFF", alignItems: "center", justifyContent: "center" }}
                    >
                      <Ionicons name="camera-outline" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}

              {photos.length === 0 && (
                <TouchableOpacity
                  onPress={pickPhotos}
                  style={{ borderRadius: 12, borderWidth: 1.5, borderColor: "#E8EEFF", borderStyle: "dashed", backgroundColor: "#F8FAFF", padding: 24, alignItems: "center", gap: 8 }}
                >
                  <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: "#94A3B8" }}>Adaugă fotografii ale problemei</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── STEP 3: Location + Radius ── */}
        {step === 3 && (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e3a5f" }}>Locație și rază</Text>
              <Text style={{ color: "#64748B", fontSize: 14 }}>Unde ești și cât de departe cauți service-uri</Text>
            </View>

            {/* Radius */}
            <View style={{ gap: 10 }}>
              <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>
                Rază de căutare — <Text style={{ color: "#2563EB" }}>{radiusKm} km</Text>
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {RADIUS_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRadiusKm(r)}
                    style={{
                      flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center",
                      backgroundColor: radiusKm === r ? "#2563EB" : "white",
                      borderWidth: 1.5, borderColor: radiusKm === r ? "#2563EB" : "#E8EEFF",
                    }}
                  >
                    <Text style={{ fontWeight: "700", fontSize: 13, color: radiusKm === r ? "white" : "#64748B" }}>
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* GPS detected location */}
            {!showManualPicker && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Locație detectată</Text>
                {locationLoading ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: "white", borderRadius: 12, borderWidth: 1.5, borderColor: "#E8EEFF" }}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={{ color: "#64748B" }}>Se detectează locația...</Text>
                  </View>
                ) : locationLabel ? (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, backgroundColor: "#EFF6FF", borderRadius: 12, borderWidth: 1.5, borderColor: "#2563EB" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name="location" size={18} color="#2563EB" />
                      <Text style={{ fontWeight: "600", color: "#1e3a5f" }}>{locationLabel}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowManualPicker(true)}>
                      <Text style={{ color: "#2563EB", fontSize: 13, fontWeight: "600" }}>Schimbă</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}

            {/* Manual region picker — shown only when user taps Schimbă or GPS fails */}
            {showManualPicker && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>
                Regiune <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opțional)</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setRegionModalVisible(true)}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: "white", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14,
                  borderWidth: 1.5, borderColor: selectedRegionId ? "#2563EB" : "#E8EEFF",
                }}
              >
                <Text style={{ color: selectedRegionId ? "#1e3a5f" : "#94A3B8", fontSize: 15, fontWeight: selectedRegionId ? "600" : "400" }}>
                  {selectedRegionId ? regions.find(r => r.id === selectedRegionId)?.name : "Selectează regiune..."}
                </Text>
                <Ionicons name={selectedRegionId ? "close-circle" : "chevron-down"} size={18} color="#94A3B8"
                  onPress={selectedRegionId ? () => { setSelectedRegionId(null); setCityId(null); setChisinauZoneId(null); } : undefined}
                />
              </TouchableOpacity>
            </View>
            )}

            {/* Region modal */}
            <Modal visible={regionModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRegionModalVisible(false)}>
              <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EFF3FA" }}>
                  <Text style={{ flex: 1, fontWeight: "700", fontSize: 17, color: "#1e3a5f" }}>Selectează regiune</Text>
                  <Pressable onPress={() => setRegionModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </Pressable>
                </View>
                <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <TextInput
                    value={regionSearch}
                    onChangeText={setRegionSearch}
                    placeholder="Caută regiune..."
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: "#F8FAFF", borderRadius: 10, paddingVertical: 10,
                      paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: "#E8EEFF",
                    }}
                  />
                </View>
                <FlatList
                  data={regions.filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase()))}
                  keyExtractor={r => String(r.id)}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedRegionId(item.id);
                        setCityId(null);
                        setChisinauZoneId(null);
                        setRegionSearch("");
                        setRegionModalVisible(false);
                      }}
                      style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingVertical: 14, paddingHorizontal: 16,
                        borderBottomWidth: 1, borderBottomColor: "#F1F5FF",
                        backgroundColor: selectedRegionId === item.id ? "#EFF6FF" : "white",
                      }}
                    >
                      <Text style={{ fontSize: 15, color: "#1e3a5f", fontWeight: selectedRegionId === item.id ? "600" : "400" }}>
                        {item.name}
                      </Text>
                      {selectedRegionId === item.id && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                    </Pressable>
                  )}
                />
              </SafeAreaView>
            </Modal>

            {/* Cities */}
            {cities.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>Oraș</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {cities.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => { setCityId(c.id); setChisinauZoneId(null); }}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                        backgroundColor: cityId === c.id ? "#2563EB" : "white",
                        borderWidth: 1.5, borderColor: cityId === c.id ? "#2563EB" : "#E8EEFF",
                      }}
                    >
                      <Text style={{ color: cityId === c.id ? "white" : "#64748B", fontWeight: "600", fontSize: 13 }}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Chisinau zones — only for Municipiul Chișinău */}
            {chisinauZones.length > 0 && regions.find(r => r.id === selectedRegionId)?.name?.includes("Chișinău") && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontWeight: "600", color: "#1e3a5f", fontSize: 14 }}>
                  Sector <Text style={{ color: "#94A3B8", fontWeight: "400" }}>(opțional)</Text>
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {chisinauZones.map((z) => (
                    <TouchableOpacity
                      key={z.id}
                      onPress={() => setChisinauZoneId(chisinauZoneId === z.id ? null : z.id)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                        backgroundColor: chisinauZoneId === z.id ? "#0D9488" : "white",
                        borderWidth: 1.5, borderColor: chisinauZoneId === z.id ? "#0D9488" : "#E8EEFF",
                      }}
                    >
                      <Text style={{ color: chisinauZoneId === z.id ? "white" : "#64748B", fontWeight: "600", fontSize: 13 }}>
                        {z.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {mutation.isError && (
              <View style={{ padding: 14, backgroundColor: "#FEE2E2", borderRadius: 12 }}>
                <Text style={{ color: "#DC2626", fontSize: 14 }}>
                  A apărut o eroare. Verifică conexiunea și încearcă din nou.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34,
        backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#EFF3FA",
      }}>
        {step < 3 ? (
          <TouchableOpacity
            disabled={!canNext()}
            onPress={() => setStep(step + 1)}
            style={{
              backgroundColor: canNext() ? "#2563EB" : "#C7D4F5",
              borderRadius: 14, paddingVertical: 16, alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Continuă</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled={mutation.isPending}
            onPress={handleSubmit}
            style={{
              backgroundColor: "#2563EB", borderRadius: 14,
              paddingVertical: 16, alignItems: "center",
            }}
          >
            {mutation.isPending
              ? <ActivityIndicator color="white" />
              : <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Trimite cererea</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
    </AuthBackground>
  );
}
