import { useCallback, useState } from "react";

export type PressCount = Readonly<{
  /** Each new value plays one press, on the native view and on the center content. */
  pressCount: number;
  /** Plays a press, unless presses are off. */
  press: () => void;
}>;

/**
 * Counts the presses to play: taps, and each new `triggerKey`. The first key plays nothing, and a
 * press made while `enabled` is off is dropped, not played later.
 */
export function usePressCount(triggerKey: number, enabled: boolean): PressCount {
  const [presses, setPresses] = useState({ key: triggerKey, count: 0 });
  if (triggerKey !== presses.key) {
    setPresses({ key: triggerKey, count: presses.count + (enabled ? 1 : 0) });
  }

  const press = useCallback(() => {
    if (enabled) setPresses(current => ({ ...current, count: current.count + 1 }));
  }, [enabled]);

  return { pressCount: presses.count, press };
}
