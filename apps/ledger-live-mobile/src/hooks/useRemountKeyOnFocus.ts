import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";

/**
 * Returns a key that increments each time the host screen transitions from
 * blurred back to focused (not on the initial focus). Spread it into a child's
 * `key` prop to force that child to remount every time the user returns to the
 * screen.
 *
 * Workaround for LIVE-32169: under RN 0.81 / reanimated 4 on iOS the lumen
 * `AmountDisplay` digit-roll animation can get stuck on a reanimated shared
 * value. The Portfolio tab stays mounted across navigation (no `unmountOnBlur`),
 * so a stuck shared value otherwise persists even after navigating away and
 * back. Remounting on focus hands the animation fresh shared values, restoring
 * it whenever the user returns to the page.
 */
export function useRemountKeyOnFocus(): number {
  const isFocused = useIsFocused();
  const [key, setKey] = useState(0);
  const wasFocusedRef = useRef(isFocused);

  useEffect(() => {
    if (isFocused && !wasFocusedRef.current) {
      setKey(k => k + 1);
    }
    wasFocusedRef.current = isFocused;
  }, [isFocused]);

  return key;
}
