import { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Alert } from "react-native";
import { getFromSecureStore } from "../utils/secureStorage";
import { useRouter } from "expo-router";
import useBehaviorData from "../hooks/useBehaviourData";
import { verifyRisk } from "../utils/verifyRisk";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [blockTransfer, setBlockTransfer] = useState(false);

  const router = useRouter();
  const session = useBehaviorData();

  // Load user from secure storage
  useEffect(() => {
    getFromSecureStore("userData").then((data) => {
      if (data) setUser(JSON.parse(data));
      else Alert.alert("No local user found. Please log in again.");
    });
  }, []);

  // Risk detection every 15 seconds
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
    <View style={{ padding: 20 }}>
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
              Alert.alert("❌ Blocked", "Transfers are disabled due to risk.");
            } else {
              router.push("/transfer");
            }
          }}
        />
      </View>
    </View>
  );
}
