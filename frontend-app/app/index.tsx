import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={{ padding: 24 }}>
      <Text>Welcome to VigilAuth</Text>
    </View>
  );
}
