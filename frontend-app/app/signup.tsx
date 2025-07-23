import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { saveToSecureStore } from "../utils/secureStorage";
import { useRouter } from "expo-router";

export default function Signup() {
  const [accountNo, setAccountNo] = useState("");
  const router = useRouter();

  // Function to handle the signup process
  const handleSignup = async () => {
    // Basic validation for account number
    if (!accountNo) {
      Alert.alert("Error", "Please enter an account number.");
      return;
    }

    try {
      // Simulate API call to the backend for signup
      // NOTE: The URL 'http://192.168.1.3:5000/api/signup' is hardcoded here.
      // In a real application, this should be configurable (e.g., via environment variables).
      const response = await fetch("http://192.168.3.215:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNo }), // Send the account number to the backend
      });

      const data = await response.json(); // Parse the JSON response from the server

      // Check if the signup was successful based on the backend response
      if (data.success) {
        // If successful, save user data securely and show success alert
        await saveToSecureStore("userData", JSON.stringify(data.user));
        Alert.alert(
          "✅ Signup Successful",
          "You can now log in with biometrics."
        );
        router.push("/login"); // Navigate to the login page
      } else {
        // If not successful, show an alert indicating account not found or other message
        Alert.alert(
          "❌ Signup Failed",
          data.message || "Account not found or invalid."
        );
      }
    } catch (err) {
      console.error("Signup error:", err); // Log the error for debugging
      Alert.alert(
        "❌ Signup Error",
        "Could not connect to the server. Please try again later."
      );
    }
  };

  return (
    // Main container for the signup screen, applying global styles
    <View style={styles.container}>
      {/* Card-like container for the signup form */}
      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>
          Enter your bank account number to get started.
        </Text>

        {/* Account Number Input */}
        <TextInput
          style={styles.input}
          placeholder="Enter Account Number"
          placeholderTextColor="#a0aec0" // Placeholder text color
          onChangeText={setAccountNo}
          value={accountNo} // Controlled component
          keyboardType="numeric" // Ensure numeric keyboard
        />

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
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
    alignItems: "center", // Center content within the card
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
  input: {
    borderWidth: 1,
    borderColor: "#4a5568", // Darker gray border
    backgroundColor: "#1a202c", // Even darker background for input
    color: "#e2e8f0", // Light gray text input
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
    width: "100%", // Full width input
  },
  signupButton: {
    backgroundColor: "#3b82f6", // Blue button (consistent with Login)
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
