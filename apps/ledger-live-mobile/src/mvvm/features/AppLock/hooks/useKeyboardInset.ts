import { useEffect, useState } from "react";
import { Keyboard, Platform, useWindowDimensions } from "react-native";

/**
 * How much a screen has to pad itself for the keyboard: the gap between the bottom of the app window
 * and the top of the keyboard.
 *
 * Measured from the keyboard's position rather than its height, which answers both platforms at once
 * — a window that `adjustResize` shrank ends where the keyboard starts, so the gap is zero, while an
 * edge-to-edge window keeps its full height and the gap is the whole keyboard. It is also read
 * straight from the current metrics, so a screen that mounts with the keyboard already up — the
 * confirm step of the password flow, arriving from the step before it — pads itself without waiting
 * for an event that has already been and gone.
 */
export function useKeyboardInset(): number {
  const { height } = useWindowDimensions();
  const [keyboardTop, setKeyboardTop] = useState(() => Keyboard.metrics()?.screenY);

  useEffect(() => {
    const isIOS = Platform.OS === "ios";
    const show = Keyboard.addListener(
      isIOS ? "keyboardWillShow" : "keyboardDidShow",
      ({ endCoordinates }) => setKeyboardTop(endCoordinates.screenY),
    );
    const hide = Keyboard.addListener(isIOS ? "keyboardWillHide" : "keyboardDidHide", () =>
      setKeyboardTop(undefined),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboardTop === undefined ? 0 : Math.max(0, height - keyboardTop);
}
