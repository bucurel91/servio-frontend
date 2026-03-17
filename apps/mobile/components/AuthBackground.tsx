import { View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

export function AuthBackground({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  const topX = width;
  const bottomX = width * 0.02;
  const cp1x = width * 1.2;
  const cp1y = height * 0.22;
  const cp2x = width * -0.2;
  const cp2y = height * 0.78;
  const bluePath = `M ${topX},0 L ${width},0 L ${width},${height} L ${bottomX},${height} C ${cp2x},${cp2y} ${cp1x},${cp1y} ${topX},0 Z`;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF4E6" }}>
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={width} height={height}>
        <Path d={bluePath} fill="#EFF6FF" />
      </Svg>
      {children}
    </View>
  );
}
