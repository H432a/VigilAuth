import { useState, useRef } from "react";
import { GestureResponderEvent, PanResponder } from "react-native";

export default function useBehaviorTracker() {
  interface Session {
    X: number;
    Y: number;
    Pressure: number;
    Duration: number;
    Orientation: number;
    Size: number;
  }

  const [events, setEvents] = useState<Session[]>([]);
  const [isLongPress, setIsLongPress] = useState(false);

  const startTime = useRef<number | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      startTime.current = Date.now();
      longPressTimeout.current = setTimeout(() => {
        console.warn("⚠️ Long press detected!");
        setIsLongPress(true); // trigger high risk
      }, 3000); // 3 seconds long press threshold
    },

    onPanResponderMove: (evt: GestureResponderEvent) => {
      const touch = evt.nativeEvent;
      const duration = Date.now() - (startTime.current ?? Date.now());

      setEvents((prev) => [
        ...prev,
        {
          X: touch.locationX,
          Y: touch.locationY,
          Pressure: touch.force || 0.5,
          Duration: duration,
          Orientation: 0,
          Size: touch.radiusX || 0.5,
        },
      ]);
    },

    onPanResponderRelease: () => {
      clearTimeout(longPressTimeout.current!);
    },

    onPanResponderTerminate: () => {
      clearTimeout(longPressTimeout.current!);
    },
  });

  return { panResponder, events, isLongPress };
}
