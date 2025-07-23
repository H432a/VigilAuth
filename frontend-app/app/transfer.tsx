import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
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

  // Effect to handle redirection to fake dashboard on long press (high risk)
  useEffect(() => {
    if (isLongPress) {
      router.replace("/fake-dashboard"); // Navigate to fake dashboard on long press
    }
  }, [isLongPress, router]); // Dependency array includes isLongPress and router

  // Function to handle the money transfer
  const handleTransfer = async () => {
    // Basic validation for input fields
    if (!toAccount || !amount || !description) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    // Retrieve user data securely from storage
    const userData = await getFromSecureStore("userData");
    if (!userData) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    const sender = JSON.parse(userData); // Parse sender's data

    try {
      // Simulate API call to the backend for transfer
      // NOTE: The URL 'http://192.168.162.215:5000/api/transfer' is hardcoded here.
      // In a real application, this should be configurable (e.g., via environment variables).
      const response = await fetch("http://192.168.3.215:5000/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: behaviorData, // Include collected behavior data
          fromAccount: sender.accountNo,
          toAccount,
          amount: parseFloat(amount), // Convert amount to a float
          description,
        }),
      });

      const data = await response.json(); // Parse the JSON response from the server

      // Check if the API response indicates success or failure
      if (!response.ok) {
        Alert.alert("❌ Failed", data.message || "Transfer failed");
      } else {
        Alert.alert("✅ Success", data.message || "Transfer complete");
        // Optionally, clear form fields after successful transfer
        setToAccount("");
        setAmount("");
        setDescription("");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      Alert.alert(
        "❌ Error",
        "Server not reachable. Please check your connection."
      );
    }
  };

  return (
    // Main container for the transfer screen, applying global styles
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Card-like container for the transfer form */}
      <View style={styles.card}>
        <Text style={styles.title}>Transfer Money</Text>
        <Text style={styles.subtitle}>
          Send funds securely to another account.
        </Text>

        {/* Recipient Account Number Input */}
        <Text style={styles.label}>Recipient Account No:</Text>
        <TextInput
          style={styles.input}
          value={toAccount}
          onChangeText={setToAccount}
          keyboardType="numeric" // Ensure numeric keyboard for account number
          placeholder="e.g., 1234567890"
          placeholderTextColor="#a0aec0"
        />

        {/* Amount Input */}
        <Text style={styles.label}>Amount (₹):</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric" // Ensure numeric keyboard for amount
          placeholder="e.g., 500.00"
          placeholderTextColor="#a0aec0"
        />

        {/* Description Input */}
        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Monthly rent"
          placeholderTextColor="#a0aec0"
          multiline // Allow multiple lines for description
          numberOfLines={3} // Suggest 3 lines initially
        />

        {/* Send Money Button */}
        <TouchableOpacity style={styles.sendButton} onPress={handleTransfer}>
          <Text style={styles.buttonText}>Send Money</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a202c", // Dark background
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#2d3748", // Card background
    borderRadius: 16,
    padding: 30,
    width: "100%",
    maxWidth: 400, // Max width for larger screens
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, // Android shadow
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e2e8f0", // Light gray text
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#a0aec0", // Medium gray text
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#e2e8f0", // Light gray text for labels
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#4a5568", // Darker gray border
    backgroundColor: "#1a202c", // Even darker background for input
    color: "#e2e8f0", // Light gray text input
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#22c55e", // Green for send button (success/action)
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
