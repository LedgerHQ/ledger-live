import { useState, useCallback } from "react";
import { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";

type useAnimatedInputFocusProps = {
  onFocusCallback?: (
    e: NativeSyntheticEvent<TextInputFocusEventData>,
  ) => TextInputFocusEventData | void;
  onBlurCallback?: (
    e: NativeSyntheticEvent<TextInputFocusEventData>,
  ) => TextInputFocusEventData | void;
};

export const useAnimatedInputFocus = ({
  onFocusCallback,
  onBlurCallback,
}: useAnimatedInputFocusProps) => {
  const [focused, setFocused] = useState(false);

  const onFocus = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(true);
    onFocusCallback && onFocusCallback(e);
  }, []);

  const onBlur = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false);
    onBlurCallback && onBlurCallback(e);
  }, []);

  return { onFocus, onBlur, focused };
};
