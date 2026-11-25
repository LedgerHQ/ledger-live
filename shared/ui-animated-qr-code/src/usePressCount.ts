import { useCallback, useState } from "react";

export type PressCount = Readonly<{
  /** Each new value plays one ripple on the native view. */
  pressCount: number;
  /** Each new value pops the center content: trigger keys only, a tap has already grown it. */
  popCount: number;
  /** Plays a press, unless presses are off. */
  press: () => void;
}>;

/**
 * Counts the presses to play: taps, and each new `triggerKey`. The first key plays nothing, and a
 * press made while `enabled` is off is dropped, not played later.
 */
export function usePressCount(triggerKey: number, enabled: boolean): PressCount {
  const [presses, setPresses] = useState({ key: triggerKey, count: 0, pops: 0 });
  if (triggerKey !== presses.key) {
    const played = enabled ? 1 : 0;
    setPresses({
      key: triggerKey,
      count: presses.count + played,
      pops: presses.pops + played,
    });
  }

  const press = useCallback(() => {
    if (enabled) setPresses(current => ({ ...current, count: current.count + 1 }));
  }, [enabled]);

  return { pressCount: presses.count, popCount: presses.pops, press };
}
