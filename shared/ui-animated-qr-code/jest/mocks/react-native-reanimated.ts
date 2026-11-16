// Reanimated without the UI thread: shared values are plain boxes, animated styles are computed
// at render, and tests drive frame callbacks with `runFrame`.
import { useEffect, useMemo, useRef } from "react";

type FrameCallback = (frame: { timestamp: number }) => void;
type Registration = { active: boolean; callback: FrameCallback };

const registrations = new Set<Registration>();
let reducedMotion = false;

/** Calls every active frame callback, as the UI thread would at `timestamp` (ms). */
export function runFrame(timestamp: number): void {
  registrations.forEach(registration => {
    if (registration.active) registration.callback({ timestamp });
  });
}

export function setReducedMotion(reduced: boolean): void {
  reducedMotion = reduced;
}

export function useReducedMotion(): boolean {
  return reducedMotion;
}

export function useSharedValue<T>(initial: T) {
  const box = useRef<{ get: () => T; set: (value: T) => void } | null>(null);
  if (box.current === null) {
    let value = initial;
    box.current = {
      get: () => value,
      set: next => {
        value = next;
      },
    };
  }
  return box.current;
}

export function useAnimatedStyle<T>(updater: () => T): T {
  return updater();
}

export function useFrameCallback(callback: FrameCallback, autostart = true) {
  const registration = useRef<Registration>({ active: autostart, callback });
  registration.current.callback = callback;

  useEffect(() => {
    const current = registration.current;
    registrations.add(current);
    return () => {
      registrations.delete(current);
    };
  }, []);

  return useMemo(
    () => ({
      setActive: (active: boolean) => {
        registration.current.active = active;
      },
    }),
    [],
  );
}

export default { View: "Animated.View" };
