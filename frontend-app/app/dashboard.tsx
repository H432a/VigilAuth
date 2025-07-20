import { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  Alert,
  PanResponder,
  GestureResponderEvent,
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
  useBehaviorTracking(setSession); // Track sensor session
  useBehaviorData(); // Optional if used for further feature analysis

  // ✅ PanResponder to detect long press on top-left corner
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      if (locationX < 60 && locationY < 60) {
        const timer = setTimeout(() => {
          Alert.alert("🔐 Duress Mode", "Entering fake dashboard...");
          router.replace("/fake-dashboard");
        }, 5000);
        setDuressTimer(timer);
      }
    },
    onPanResponderRelease: () => {
      if (duressTimer) {
        clearTimeout(duressTimer);
        setDuressTimer(null);
      }
    },
  });

  // ✅ Load user data securely
  useEffect(() => {
    getFromSecureStore("userData").then((data) => {
      if (data) setUser(JSON.parse(data));
      else Alert.alert("No local user found. Please log in again.");
    });
  }, []);

  // ✅ Every 15s, send 50-length session to ML model
  useEffect(() => {
    const interval = setInterval(async () => {
      if (session.length === 50) {
        try {
          const { riskScore, level } = await verifyRisk(session);

          if (level === "high") {
            Alert.alert(
              "⚠️ Security Alert",
              "High risk detected. Logging out..."
            );
            router.replace("/fake-dashboard");
          } else if (level === "medium") {
            Alert.alert(
              "⚠️ Warning",
              "Some features will be temporarily disabled."
            );
            setBlockTransfer(true);
          } else {
            setBlockTransfer(false);
          }
        } catch (err) {
          console.warn("Risk verification failed:", err);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [session]);

  if (!user) return <Text style={{ padding: 20 }}>Loading...</Text>;

  return (
    <View style={{ padding: 20 }} {...panResponder.panHandlers}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        🏦 Bank: {user.bankName}
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        📄 Account No: {user.accountNo}
      </Text>

      <Button
        title={showBalance ? "Hide Balance" : "View Balance"}
        onPress={() => setShowBalance(!showBalance)}
      />

      {showBalance && (
        <Text style={{ marginVertical: 10, fontSize: 16 }}>
          💰 Balance: ₹{user.balance}
        </Text>
      )}

      <View style={{ marginVertical: 10 }}>
        <Button
          title={showTransactions ? "Hide Transactions" : "View Transactions"}
          onPress={() => setShowTransactions(!showTransactions)}
        />
      </View>

      {showTransactions && (
        <FlatList
          data={user.transactions}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <Text style={{ marginVertical: 4 }}>
              📅 {item.date?.slice(0, 10)} | {item.type}: ₹{item.amount} |{" "}
              {item.description}
            </Text>
          )}
        />
      )}

      <View style={{ marginTop: 20 }}>
        <Button
          title="Transfer Money"
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
        />
      </View>
    </View>
  );
}
