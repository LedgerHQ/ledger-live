// Reanimated without the UI thread: shared values are plain boxes and animated styles are computed
// at render. An animation never advances: the value keeps where it started, and tests read the
// running animation with `runningAnimation`.
import { useRef } from "react";

type Timing = Readonly<{ type: "timing"; toValue: number; duration?: number }>;
type Repeat = Readonly<{ type: "repeat"; animation: Timing; count: number }>;
type Animation = Timing | Repeat;

type MockSharedValue<T> = {
  get: () => T;
  set: (value: T | Animation) => void;
  animation: Animation | null;
};

let reducedMotion = false;

export function setReducedMotion(reduced: boolean): void {
  reducedMotion = reduced;
}

export function useReducedMotion(): boolean {
  return reducedMotion;
}

const isAnimation = (value: unknown): value is Animation =>
  typeof value === "object" && value !== null && "type" in value;

export function useSharedValue<T>(initial: T): MockSharedValue<T> {
  const box = useRef<MockSharedValue<T> | null>(null);
  if (box.current === null) {
    let value = initial;
    const sharedValue: MockSharedValue<T> = {
      get: () => value,
      set: next => {
        if (isAnimation(next)) {
          sharedValue.animation = next;
          return;
        }
        sharedValue.animation = null;
        value = next;
      },
      animation: null,
    };
    box.current = sharedValue;
  }
  return box.current;
}

export function runningAnimation(sharedValue: unknown): Animation | null {
  return (sharedValue as MockSharedValue<unknown>).animation;
}

export const withTiming = jest.fn((toValue: number, config?: { duration?: number }): Timing => ({
  type: "timing",
  toValue,
  duration: config?.duration,
}));

export function withRepeat(animation: Timing, count: number): Repeat {
  return { type: "repeat", animation, count };
}

export function cancelAnimation(sharedValue: MockSharedValue<unknown>): void {
  sharedValue.animation = null;
}

export const Easing = { linear: (t: number) => t };

export function useAnimatedStyle<T>(updater: () => T): T {
  return updater();
}

// Any animated component renders as the Animated.View host, its style readable in tests.
export const createAnimatedComponent = () => "Animated.View";
