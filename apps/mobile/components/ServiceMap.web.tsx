import { View } from "react-native";

interface Props {
  latitude: number;
  longitude: number;
  businessName: string;
  address?: string | null;
}

export function ServiceMap({ latitude, longitude }: Props) {
  const delta = 0.008;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <View style={{ borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(147,197,253,0.4)", height: 200 }}>
      {/* @ts-ignore — iframe is valid in React Native Web */}
      <iframe
        src={src}
        style={{ width: "100%", height: "100%", border: 0 }}
        loading="lazy"
      />
    </View>
  );
}
