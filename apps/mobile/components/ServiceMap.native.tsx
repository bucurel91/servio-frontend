import { View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

interface Props {
  latitude: number;
  longitude: number;
  businessName: string;
  address?: string | null;
}

export function ServiceMap({ latitude, longitude, businessName, address }: Props) {
  return (
    <View style={{ borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(147,197,253,0.4)", height: 200 }}>
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={businessName}
          description={address ?? undefined}
        />
      </MapView>
    </View>
  );
}
