import { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Alert } from "react-native";
import { getFromSecureStore } from "../utils/secureStorage";
import { useRouter } from "expo-router"; // ✅ Import useRouter

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showBalance, setShowBalance] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const router = useRouter(); // ✅ Use Expo Router navigation

  useEffect(() => {
    getFromSecureStore("userData").then((data) => {
      if (data) setUser(JSON.parse(data));
      else Alert.alert("No local user found");
    });
  }, []);

  if (!user) return <Text>Loading...</Text>;

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
          onPress={() => router.push("/transfer")} // ✅ Use router.push with route path
        />
      </View>
    </View>
  );
}
