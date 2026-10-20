import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, type KeyboardMetrics, type View } from "react-native";

const keyboardShowEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const keyboardHideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

export function useKeyboardOverlap() {
  const containerRef = useRef<View>(null);
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);

  const measureOverlap = useCallback((keyboard: KeyboardMetrics | undefined) => {
    if (!keyboard) {
      setKeyboardOverlap(0);
      return;
    }
    containerRef.current?.measureInWindow((_x, y, _width, height) => {
      setKeyboardOverlap(Math.max(0, y + height - keyboard.screenY));
    });
  }, []);

  const onContainerLayout = useCallback(() => {
    measureOverlap(Keyboard.metrics());
  }, [measureOverlap]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(keyboardShowEvent, event =>
      measureOverlap(event.endCoordinates),
    );
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => setKeyboardOverlap(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [measureOverlap]);

  return { containerRef, onContainerLayout, keyboardOverlap };
}
