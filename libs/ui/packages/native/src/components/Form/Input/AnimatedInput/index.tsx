import React, { useState } from "react";
import { BaseInput } from "..";
import { type InputProps as BaseInputType } from "../BaseInput/index";
import styled, { useTheme } from "styled-components/native";
import { StyleProp, View, ViewProps, ViewStyle, TextInput } from "react-native";

import { inputTextColor, inputStatusColors, getInputStatus } from "./inputTextColor";
import { useAnimatedInputFocus } from "./useAnimatedInputFocus";
import { AnimatedNotchedLabel } from "./AnimatedNotchedLabel";

export type InputStatus = "default" | "focused" | "filled" | "error";
export interface AnimatedInputProps extends BaseInputType {
  style?: StyleProp<ViewStyle>;
  largeMode?: boolean;
}

type InputContainerProps = {
  status: InputStatus;
} & ViewProps;

const InputContainer = styled(View)<InputContainerProps>`
  position: relative;
  box-sizing: border-box;
`;

const AnimatedInput = (
  { style = { width: "100%" }, ...textInputProps }: AnimatedInputProps,
  ref?: React.ForwardedRef<TextInput> | null,
) => {
  const {
    placeholder,
    onFocus: onFocusCallback,
    onBlur: onBlurCallback,
    error,
    value,
    largeMode = false,
    ...rest
  } = textInputProps;

  const theme = useTheme();
  const { onFocus, onBlur, focused } = useAnimatedInputFocus({
    onFocusCallback,
    onBlurCallback,
  });

  const [height, setHeight] = useState<number>(48);

  const inputStatus = getInputStatus({ focused, hasError: !!error, hasValue: !!value });
  const displayClearCross = inputStatus === "error" || inputStatus === "focused";

  const handleContentSizeChange = (event: any) => {
    const newHeight = event.nativeEvent.contentSize.height;
    setHeight(newHeight + 40);
  };

  return (
    <InputContainer status={inputStatus} style={style}>
      {placeholder && (
        <AnimatedNotchedLabel placeholder={placeholder} inputStatus={inputStatus} value={value} />
      )}
      <BaseInput
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        error={error}
        multiline={largeMode}
        value={value}
        color={theme ? inputTextColor[inputStatus]({ theme }) : "neutral.c100"}
        inputContainerStyle={{
          backgroundColor: "none",
          borderColor: theme ? inputStatusColors[inputStatus]({ theme }) : "neutral.c100",
          borderRadius: 8,
          height: inputStatus !== "error" ? (height < 48 ? 48 : height) : height,
          paddingTop: largeMode ? 14 : 0,
          paddingRight: largeMode ? 30 : 0,
        }}
        baseInputContainerStyle={{
          paddingRight: displayClearCross ? 8 : 14,
        }}
        inputErrorContainerStyles={{
          marginTop: 8,
        }}
        inputErrorColor={theme ? inputStatusColors[inputStatus]({ theme }) : "neutral.c100"}
        showErrorIcon
        onContentSizeChange={largeMode ? handleContentSizeChange : undefined}
        largeMode={largeMode}
        {...rest}
      />
    </InputContainer>
  );
};

export default React.forwardRef(AnimatedInput);
