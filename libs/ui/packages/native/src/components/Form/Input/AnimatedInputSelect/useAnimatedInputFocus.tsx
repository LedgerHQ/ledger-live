import { useState } from "react";
import { TextInputProps } from "react-native";

type useAnimatedInputFocusProps = {
  onFocusCallback?: TextInputProps["onFocus"];
  onBlurCallback?: TextInputProps["onBlur"];
};

export const useAnimatedInputFocus = ({
  onFocusCallback,
  onBlurCallback,
}: useAnimatedInputFocusProps) => {
  const [focused, setFocused] = useState(false);

  const onFocus: NonNullable<TextInputProps["onFocus"]> = e => {
    setFocused(true);
    onFocusCallback?.(e);
  };

  const onBlur: NonNullable<TextInputProps["onBlur"]> = e => {
    setFocused(false);
    onBlurCallback?.(e);
  };

  return { onFocus, onBlur, focused };
};
