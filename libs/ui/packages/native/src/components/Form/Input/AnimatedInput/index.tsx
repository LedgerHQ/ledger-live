import React from "react";
import { BaseInput } from "..";
import { type InputProps as BaseInputType } from "../BaseInput/index";
import styled, { useTheme } from "styled-components/native";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";

import { inputTextColor, inputStatusColors, getInputStatus } from "./inputTextColor";
import { useAnimatedInputFocus } from "./useAnimatedInputFocus";
import { AnimatedNotchedLabel } from "./AnimatedNotchedLabel";

export type InputStatus = "default" | "focused" | "filled" | "error";
export interface AnimatedInputProps extends BaseInputType {
  style?: StyleProp<ViewStyle>;
}

type InputContainerProps = {
  status: InputStatus;
} & ViewProps;

const InputContainer = styled(View)<InputContainerProps>`
  position: relative;
  box-sizing: border-box;
  height: fit-content;
`;

const AnimatedInput = ({ style = { width: "100%" }, ...textInputProps }: AnimatedInputProps) => {
  const {
    placeholder,
    onFocus: onFocusCallback,
    onBlur: onBlurCallback,
    error,
    value,
    ...rest
  } = textInputProps;

  const theme = useTheme();
  const { onFocus, onBlur, focused } = useAnimatedInputFocus({
    onFocusCallback,
    onBlurCallback,
  });

  const inputStatus = getInputStatus({ focused, hasError: !!error, hasValue: !!value });
  const displayClearCross = inputStatus === "error" || inputStatus === "focused";

  return (
    <InputContainer status={inputStatus} style={style}>
      {placeholder && <AnimatedNotchedLabel placeholder={placeholder} inputStatus={inputStatus} />}
      <BaseInput
        onFocus={onFocus}
        onBlur={onBlur}
        error={error}
        value={value as string}
        containerStyle={{
          height: "100%",
        }}
        color={theme ? inputTextColor[inputStatus]({ theme }) : "neutral.c100"}
        inputContainerStyle={{
          backgroundColor: "none",
          borderColor: theme ? inputStatusColors[inputStatus]({ theme }) : "neutral.c100",
          borderRadius: 8,
          height: inputStatus !== "error" ? 56 : 48,
        }}
        baseInputContainerStyle={{
          paddingTop: 15,
          paddingBottom: 15,
          paddingLeft: 14,
          paddingRight: displayClearCross ? 8 : 14,
        }}
        inputErrorContainerStyles={{
          marginTop: 8,
        }}
        inputErrorColor={theme ? inputStatusColors[inputStatus]({ theme }) : "neutral.c100"}
        showErrorIcon
        {...rest}
      />
    </InputContainer>
  );
};

export default AnimatedInput;
