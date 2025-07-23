import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { getFromSecureStore } from "../utils/secureStorage";
import { authenticateWithBiometrics } from "../utils/auth";
import { useRouter } from "expo-router";

// Main App component for the login screen
export default function Login() {
  const router = useRouter();

  // handleLogin function contains the core biometric authentication and navigation logic
  const handleLogin = async () => {
    // Attempt biometric authentication
    const success = await authenticateWithBiometrics();
    if (!success) {
      // If authentication fails, show an alert
      Alert.alert("Authentication failed", "Please try again.");
      return;
    }

    // If authentication is successful, try to retrieve user data from secure storage
    const data = await getFromSecureStore("userData");
    if (!data) {
      // If no local account is found, prompt the user to sign up
      Alert.alert("No local account found", "Please sign up again.", [
        {
          text: "OK",
          onPress: () => router.replace("/signup"), // Navigate to the signup page
        },
      ]);
      return;
    }

    // If data is found and authentication is successful, navigate to the dashboard
    router.push("/dashboard"); // Navigate to the dashboard page
  };

  return (
    // Main container for the login screen, covering the full view
    <View style={styles.container}>
      {/* Card-like container for the login elements */}
      <View style={styles.card}>
        {/* Application title */}
        <Text style={styles.title}>VigilAuth Bank</Text>
        {/* Subtitle or tagline */}
        <Text style={styles.subtitle}>
          Secure Banking, Powered by Canara Bank
        </Text>

        {/* TouchableOpacity for the login button, styled for a modern look */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login with Biometrics</Text>
        </TouchableOpacity>

        {/* Footer text for additional information or branding */}
        <Text style={styles.footerText}>Your security is our priority.</Text>
      </View>
    </View>
  );
}

// StyleSheet for React Native components, defining the visual styles
const styles = StyleSheet.create({
  container: {
    flex: 1, // Takes up the entire screen space
    backgroundColor: "#1a202c", // Dark background color (similar to previous glitch screen)
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
    padding: 20, // Padding around the container
  },
  card: {
    backgroundColor: "#2d3748", // Slightly lighter dark background for the card
    borderRadius: 16, // Rounded corners for the card
    padding: 30, // Inner padding of the card
    width: "90%", // Card takes 90% of screen width
    maxWidth: 400, // Maximum width for larger screens
    alignItems: "center", // Center items within the card horizontally
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8, // Android shadow
  },
  title: {
    fontSize: 32, // Large font size for the title
    fontWeight: "bold", // Bold font weight
    color: "#e2e8f0", // Light gray color for title text
    marginBottom: 10, // Space below the title
  },
  subtitle: {
    fontSize: 16, // Standard font size for subtitle
    color: "#a0aec0", // Medium gray color for subtitle text
    marginBottom: 40, // More space below the subtitle
    textAlign: "center", // Center align the subtitle text
  },
  loginButton: {
    backgroundColor: "#3b82f6", // Blue background for the button
    paddingVertical: 15, // Vertical padding
    paddingHorizontal: 30, // Horizontal padding
    borderRadius: 10, // Rounded corners for the button
    width: "100%", // Button takes full width of its container
    alignItems: "center", // Center text within the button
    marginBottom: 20, // Space below the button
  },
  buttonText: {
    color: "white", // White text color for the button
    fontSize: 18, // Font size for button text
    fontWeight: "bold", // Bold font weight for button text
    textAlign: "center",
  },
  footerText: {
    fontSize: 12, // Small font size for footer text
    color: "#a0aec0", // Medium gray color for footer text
    marginTop: 10, // Space above the footer text
    textAlign: "center",
  },
});
