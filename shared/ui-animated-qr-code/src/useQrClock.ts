import { type SharedValue, useFrameCallback, useSharedValue } from "react-native-reanimated";
import { getAutoTouch, NO_TOUCH, type QrTouch } from "./animationTimeline";
import type { QrAnimation } from "./types";

export type QrClock = Readonly<{ time: SharedValue<number>; touch: SharedValue<QrTouch> }>;

/** Seconds since mount and the finger, on the UI thread; auto play moves the finger itself. */
export function useQrClock(animation: QrAnimation, autoPlay: boolean): QrClock {
  const time = useSharedValue(0);
  const touch = useSharedValue<QrTouch>(NO_TOUCH);

  useFrameCallback(({ timeSinceFirstFrame }) => {
    const now = timeSinceFirstFrame / 1000;
    time.set(now);
    if (autoPlay) touch.set(getAutoTouch(animation, now, touch.get()));
  });

  return { time, touch };
}
