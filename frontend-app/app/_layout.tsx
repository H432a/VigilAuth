import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import GestureWrapper from "../components/GestureWrapper"; // ✅ Import your gesture wrapper

export default function Layout() {
  return (
    <GestureWrapper>
      <SafeAreaView style={{ flex: 1 }}>
        <Slot /> {/* All screens in app/ go here */}
      </SafeAreaView>
    </GestureWrapper>
  );
}
