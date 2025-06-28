// app/signup.tsx
import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { saveToSecureStore } from "../utils/secureStorage";
import { useRouter } from "expo-router"; // ✅ import router

export default function Signup() {
  const [accountNo, setAccountNo] = useState("");
  const router = useRouter(); // ✅ use router

  const handleSignup = async () => {
    try {
      const response = await fetch("http://192.168.1.3:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNo }),
      });

      const data = await response.json();

      if (data.success) {
        await saveToSecureStore("userData", JSON.stringify(data.user));
        Alert.alert("Signup successful");
        router.push("/login"); // ✅ navigate using router
      } else {
        Alert.alert("Account not found");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Signup error");
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter Account Number"
        onChangeText={setAccountNo}
        style={{
          borderWidth: 1,
          marginBottom: 10,
          padding: 8,
          borderRadius: 6,
        }}
      />
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
}
