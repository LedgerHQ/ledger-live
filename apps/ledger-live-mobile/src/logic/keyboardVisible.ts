import { useEffect, useState } from "react";
import { Keyboard, type PlatformOSType } from "react-native";

export type KeyboardEventTiming = "will" | "did";

export type UseKeyboardVisibleOptions = Readonly<{
  eventTiming?: KeyboardEventTiming;
}>;

export type KeyboardVisibility = Readonly<{
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}>;

export function shouldUseKeyboardAvoidance(
  platform: PlatformOSType,
  version: number | string,
): boolean {
  return platform === "ios" || (platform === "android" && Number(version) >= 35);
}

export function useKeyboardVisible({
  eventTiming = "did",
}: UseKeyboardVisibleOptions = {}): KeyboardVisibility {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = eventTiming === "will" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = eventTiming === "will" ? "keyboardWillHide" : "keyboardDidHide";
    const keyboardDidShowListener = Keyboard.addListener(showEvent, event => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [eventTiming]);

  return { isKeyboardVisible, keyboardHeight };
}
