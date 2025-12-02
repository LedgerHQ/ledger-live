import { useState } from "react";
import { BlurEvent, FocusEvent } from "react-native";

type useAnimatedInputFocusProps = {
  onFocusCallback?: (e: FocusEvent) => FocusEvent | void;
  onBlurCallback?: (e: BlurEvent) => BlurEvent | void;
};

export const useAnimatedInputFocus = ({
  onFocusCallback,
  onBlurCallback,
}: useAnimatedInputFocusProps) => {
  const [focused, setFocused] = useState(false);

  const onFocus = (e: FocusEvent) => {
    setFocused(true);
    onFocusCallback?.(e);
  };

  const onBlur = (e: BlurEvent) => {
    setFocused(false);
    onBlurCallback?.(e);
  };

  return { onFocus, onBlur, focused };
};
