import { useCallback, useEffect, useState } from "react";
import {
  type FrameInfo,
  type SharedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import { NEVER_PRESSED } from "./animationTimeline";

export type QrClock = Readonly<{
  /** Seconds since the first frame. */
  time: SharedValue<number>;
  /** Time of the last press, or NEVER_PRESSED. */
  pressedAt: SharedValue<number>;
  /** Starts a press now, unless motion is off. */
  press: () => void;
  /** Presses played from `triggerKey`, for the native view: each new value plays one. */
  pressCount: number;
}>;

const NOT_STARTED = -1;

/** The animation clock, on the UI thread. With `animated` off, time stays at 0 and presses do nothing. */
export function useQrClock(triggerKey: number, animated: boolean): QrClock {
  const time = useSharedValue(0);
  const pressedAt = useSharedValue(NEVER_PRESSED);
  const startedAt = useSharedValue(NOT_STARTED);

  // Reanimated registers the callback again when it changes, and timeSinceFirstFrame then restarts
  // at 0: a press stored before would replay later. The absolute timestamp keeps the clock going.
  const onFrame = useCallback(
    ({ timestamp }: FrameInfo) => {
      "worklet";
      if (startedAt.get() === NOT_STARTED) startedAt.set(timestamp);
      time.set((timestamp - startedAt.get()) / 1000);
    },
    [startedAt, time],
  );
  const { setActive } = useFrameCallback(onFrame, false);

  useEffect(() => {
    setActive(animated);
    if (animated) return;
    time.set(0);
    pressedAt.set(NEVER_PRESSED);
  }, [animated, pressedAt, setActive, time]);

  const press = useCallback(() => {
    if (animated) pressedAt.set(time.get());
  }, [animated, pressedAt, time]);

  // Counts new keys only: neither the first render nor a change of `animated` replays the last one.
  const [trigger, setTrigger] = useState({ key: triggerKey, pressCount: 0 });
  if (triggerKey !== trigger.key) {
    setTrigger({ key: triggerKey, pressCount: trigger.pressCount + (animated ? 1 : 0) });
  }

  useEffect(() => {
    if (trigger.pressCount > 0) pressedAt.set(time.get());
  }, [trigger.pressCount, pressedAt, time]);

  return { time, pressedAt, press, pressCount: trigger.pressCount };
}
