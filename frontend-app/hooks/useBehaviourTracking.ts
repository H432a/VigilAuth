import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";

export default function useBehaviorTracking(setSession: any) {
  const lastTouchTime = useRef<number | null>(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(1000);
    const sub = Accelerometer.addListener((data) => {
      setSession((prev: any[]) => {
        const newPoint = {
          timestamp: Date.now(),
          x: data.x,
          y: data.y,
          z: data.z,
        };
        return [...prev.slice(-49), newPoint];
      });
    });
    return () => sub.remove();
  }, []);
}
