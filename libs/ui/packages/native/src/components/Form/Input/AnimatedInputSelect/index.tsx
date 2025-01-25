import React from "react";
import { AnimatedInput } from "..";
import { type InputProps as BaseInputType } from "../BaseInput/index";
import { useTheme } from "styled-components/native";
import { StyleProp, ViewStyle, TextInput } from "react-native";

import { useAnimatedInputFocus } from "../AnimatedInput/useAnimatedInputFocus";
import { getInputStatus, inputStatusColors } from "../AnimatedInput/inputTextColor";
import { SelectComponent } from "./Select";

export interface AnimatedInputProps extends BaseInputType {
  selectProps: {
    onPressSelect?: () => void;
    text: string;
  };
  style?: StyleProp<ViewStyle>;
}

const AnimatedInputSelect = (
  { selectProps, ...textInputProps }: AnimatedInputProps,
  ref?: React.ForwardedRef<TextInput> | null,
) => {
  const {
    placeholder,
    onFocus: onFocusCallback,
    onBlur: onBlurCallback,
    error,
    value,
    onChange,
    ...rest
  } = textInputProps;

  const { onPressSelect, text } = selectProps;

  const theme = useTheme();
  const { onFocus, onBlur, focused } = useAnimatedInputFocus({
    onFocusCallback,
    onBlurCallback,
  });

  const inputStatus = getInputStatus({ focused, hasError: !!error, hasValue: !!value });

  return (
    <AnimatedInput
      value={value}
      ref={ref}
      onFocus={onFocus}
      onBlur={onBlur}
      renderRight={() => (
        <SelectComponent
          text={text}
          color={inputStatusColors[inputStatus]({ theme })}
          onPressSelect={onPressSelect}
        />
      )}
      placeholder={placeholder}
      onChange={onChange}
      {...rest}
    />
  );
};

export default React.forwardRef(AnimatedInputSelect);
