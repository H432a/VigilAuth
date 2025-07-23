import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button, // Keeping Button for simplicity, but TouchableOpacity is often preferred for custom styling
  FlatList,
  Alert,
  PanResponder,
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { getFromSecureStore } from "../utils/secureStorage";
import useBehaviorTracking from "../hooks/useBehaviorTracker";
import useBehaviorData from "../hooks/useBehaviourData";
import { verifyRisk } from "../utils/verifyRisk";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [blockTransfer, setBlockTransfer] = useState(false);
  const [session, setSession] = useState<any[]>([]);
  const [duressTimer, setDuressTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const router = useRouter();
  useBehaviorTracking(); // Track sensor session
  useBehaviorData(); // Optional if used for further feature analysis

  // PanResponder to detect long press on top-left corner for duress mode
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      // Check if the touch is within the top-left 60x60 area
      if (locationX < 60 && locationY < 60) {
        const timer = setTimeout(() => {
          Alert.alert("🔐 Duress Mode", "Entering fake dashboard...");
          router.replace("/fake-dashboard"); // Navigate to fake dashboard
        }, 5000); // 5-second long press
        setDuressTimer(timer);
      }
    },
    onPanResponderRelease: () => {
      // Clear the timer if the press is released before 5 seconds
      if (duressTimer) {
        clearTimeout(duressTimer);
        setDuressTimer(null);
      }
    },
  });

  // Load user data securely on component mount
  useEffect(() => {
    getFromSecureStore("userData").then((data) => {
      if (data) setUser(JSON.parse(data));
      else Alert.alert("No local user found. Please log in again.");
    });
  }, []);

  // Periodically send session data to ML model for risk verification
  useEffect(() => {
    const interval = setInterval(async () => {
      if (session.length === 50) {
        // Only send if session has 50 events
        try {
          const { riskScore, level } = await verifyRisk(session); // Call ML model

          if (level === "high") {
            Alert.alert(
              "⚠️ Security Alert",
              "High risk detected. Logging out..."
            );
            router.replace("/fake-dashboard"); // Redirect to fake dashboard on high risk
          } else if (level === "medium") {
            Alert.alert(
              "⚠️ Warning",
              "Some features will be temporarily disabled."
            );
            setBlockTransfer(true); // Block transfers on medium risk
          } else {
            setBlockTransfer(false); // Allow transfers on low risk
          }
        } catch (err) {
          console.warn("Risk verification failed:", err);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [session]); // Re-run effect if session changes

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
        <Text style={styles.bankInfoText}>🏦 Bank: {user.bankName}</Text>
        <Text style={styles.bankInfoText}>📄 Account No: {user.accountNo}</Text>
      </View>

      {/* Balance Section */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowBalance(!showBalance)}
        >
          <Text style={styles.buttonText}>
            {showBalance ? "Hide Balance" : "View Balance"}
          </Text>
        </TouchableOpacity>

        {showBalance && (
          <Text style={styles.balanceText}>💰 Balance: ₹{user.balance}</Text>
        )}
      </View>

      {/* Transactions Section */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowTransactions(!showTransactions)}
        >
          <Text style={styles.buttonText}>
            {showTransactions ? "Hide Transactions" : "View Transactions"}
          </Text>
        </TouchableOpacity>

        {showTransactions && (
          <FlatList
            data={user.transactions}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                <Text style={styles.transactionText}>
                  {item.date?.slice(0, 10)} | {item.type}: ₹{item.amount}
                </Text>
                <Text style={styles.transactionDescription}>
                  {item.description}
                </Text>
              </View>
            )}
            style={styles.transactionList}
          />
        )}
      </View>

      {/* Transfer Money Section */}
      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.button, blockTransfer && styles.buttonDisabled]}
          onPress={() => {
            if (blockTransfer) {
              Alert.alert(
                "Blocked",
                "Transfer is disabled due to suspicious behavior."
              );
              return;
            }
            router.push({
              pathname: "/transfer",
              params: { blockTransfer: blockTransfer.toString() },
            });
          }}
          disabled={blockTransfer} // Disable button if transfers are blocked
        >
          <Text style={styles.buttonText}>Transfer Money</Text>
        </TouchableOpacity>
        {blockTransfer && (
          <Text style={styles.transferBlockedWarning}>
            Transfers are temporarily disabled.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a202c", // Dark background
    padding: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a202c",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#a0aec0",
    fontSize: 18,
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#4a5568",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e2e8f0",
    marginBottom: 10,
  },
  bankInfoText: {
    fontSize: 16,
    color: "#a0aec0",
    marginBottom: 5,
  },
  card: {
    backgroundColor: "#2d3748", // Card background
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    alignItems: "center", // Center content within cards
  },
  button: {
    backgroundColor: "#3b82f6", // Blue button
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: "80%", // Make buttons slightly narrower than card
    alignItems: "center",
    marginBottom: 10, // Space below button
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#6b7280", // Gray for disabled button
    opacity: 0.7,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22c55e", // Green for balance
    marginTop: 10,
  },
  transactionList: {
    width: "100%",
    marginTop: 10,
  },
  transactionItem: {
    backgroundColor: "#4a5568", // Darker gray for transaction items
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    width: "100%",
  },
  transactionText: {
    fontSize: 14,
    color: "#e2e8f0",
  },
  transactionDescription: {
    fontSize: 12,
    color: "#a0aec0",
    marginTop: 4,
  },
  transferBlockedWarning: {
    fontSize: 14,
    color: "#ef4444", // Red warning text
    marginTop: 10,
    textAlign: "center",
  },
});
