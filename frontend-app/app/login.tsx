// app/login.tsx
import { useState } from "react";
import { View, Button, Alert } from "react-native";
import { getFromSecureStore } from "../utils/secureStorage";
import { authenticateWithBiometrics } from "../utils/auth";
import { useRouter } from "expo-router"; // ✅ Import router

export default function Login() {
  const router = useRouter(); // ✅ Use the router hook
  const [ready, setReady] = useState(false);

  const handleLogin = async () => {
    const success = await authenticateWithBiometrics();
    if (!success) {
      Alert.alert("Authentication failed");
      return;
    }

    const data = await getFromSecureStore("userData");
    if (!data) {
      Alert.alert("No local account found", "Please sign up again", [
        {
          text: "OK",
          onPress: () => router.replace("/signup"), // ✅ navigate to signup page
        },
      ]);
      return;
    }

    router.push("/dashboard"); // ✅ Replace navigation.navigate
  };

  return (
    <View>
      <Button title="Login with Biometrics" onPress={handleLogin} />
    </View>
  );
}
