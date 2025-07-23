import React, { useRef, useEffect } from "react";
import { View, GestureResponderEvent, PanResponder } from "react-native";
import { useRouter } from "expo-router"; // or useNavigation()

export default function GestureWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const longPressTimeout = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      startTime.current = Date.now();
      longPressTimeout.current = setTimeout(() => {
        console.warn("⚠️ Long press detected globally! Redirecting...");
        router.replace("/fake-dashboard"); // redirect to fake dashboard
      }, 4000); // 4 seconds
    },

    onPanResponderRelease: () => {
      clearTimeout(longPressTimeout.current!);
    },

    onPanResponderTerminate: () => {
      clearTimeout(longPressTimeout.current!);
    },
  });

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
