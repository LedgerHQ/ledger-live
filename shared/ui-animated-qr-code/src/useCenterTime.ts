import { useEffect, useRef } from "react";
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { CENTER_POP, SHIMMER_SWEEP } from "./animationTimeline";
import type { QrAnimation } from "./types";

// The timeline runs in seconds, Reanimated in milliseconds.
const linearOver = (seconds: number) => ({ duration: seconds * 1000, easing: Easing.linear });

const restingTime = (animation: QrAnimation) => (animation === "loading" ? 0 : CENTER_POP);

/**
 * Seconds into the center animation: the loading sweep, or the pop since the last press. Reanimated
 * runs it only while it moves, and it rests at 0 while loading and at the end of the pop otherwise.
 */
export function useCenterTime(
  animation: QrAnimation,
  animated: boolean,
  pressCount: number,
): SharedValue<number> {
  const time = useSharedValue(restingTime(animation));

  useEffect(() => {
    time.set(restingTime(animation));
    if (animation !== "loading" || !animated) return;
    time.set(withRepeat(withTiming(SHIMMER_SWEEP, linearOver(SHIMMER_SWEEP)), -1));
    return () => cancelAnimation(time);
  }, [animation, animated, time]);

  // Pops on a new count only: neither a count from before the mount nor a press that switches the
  // code to loading in the same update replays a pop over the shimmer.
  const playedPressCount = useRef(pressCount);
  useEffect(() => {
    if (pressCount === playedPressCount.current) return;
    playedPressCount.current = pressCount;
    if (animation !== "ripple" || !animated) return;
    time.set(0);
    time.set(withTiming(CENTER_POP, linearOver(CENTER_POP)));
  }, [pressCount, animation, animated, time]);

  return time;
}
