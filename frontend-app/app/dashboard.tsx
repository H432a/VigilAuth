import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={{ padding: 24 }}>
      <Text>Dashboard</Text>
    </View>
  );
}
