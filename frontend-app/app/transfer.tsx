import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { getFromSecureStore } from "../utils/secureStorage";
import useBehaviorTracker from "../hooks/useBehaviorTracker"; // Updated hook with isLongPress

export default function Transfer() {
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const {
    events: behaviorData,
    panResponder,
    isLongPress,
  } = useBehaviorTracker(); // Extended hook
  const router = useRouter();

  useEffect(() => {
    if (isLongPress) {
      Alert.alert(
        "⚠️ High Risk",
        "Redirecting to fake dashboard due to suspicious behavior..."
      );
      router.replace("/fake-dashboard"); // Navigate to fake dashboard on long press
    }
  }, [isLongPress]);

  const handleTransfer = async () => {
    if (!toAccount || !amount || !description) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const userData = await getFromSecureStore("userData");
    if (!userData) return Alert.alert("Error", "User not logged in");

    const sender = JSON.parse(userData);

    try {
      const response = await fetch("http://192.168.162.215:5000/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: behaviorData, // Include touch session data
          fromAccount: sender.accountNo,
          toAccount,
          amount: parseFloat(amount),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("❌ Failed", data.message || "Transfer failed");
      } else {
        Alert.alert("✅ Success", data.message || "Transfer complete");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      Alert.alert("❌ Error", "Server not reachable");
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Text style={styles.label}>Recipient Account No:</Text>
      <TextInput
        style={styles.input}
        value={toAccount}
        onChangeText={setToAccount}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Amount:</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />

      <Button title="Send Money" onPress={handleTransfer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
    borderRadius: 6,
  },
});
