import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IoniconName, focusedName: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={24} color={color} />
  );
}

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 56 },
        tabBarLabelStyle: { fontSize: 11, marginTop: -4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Acasă",
          tabBarIcon: tabIcon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="post-request"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="cars"
        options={{
          title: "Mașini",
          tabBarIcon: tabIcon("car-outline", "car"),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Service-uri",
          tabBarIcon: tabIcon("build-outline", "build"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: tabIcon("person-outline", "person"),
        }}
      />
    </Tabs>
  );
}
