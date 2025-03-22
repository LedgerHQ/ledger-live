import React, { useCallback, useState } from "react";
import { BaseInput } from "..";
import { type InputProps as BaseInputType } from "../BaseInput/index";
import styled, { useTheme } from "styled-components/native";
import {
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
  TextInput,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from "react-native";

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

const LARGE_MODE_LINE_HEIGHT = 18;
const HEIGHT = 56;

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

  const [height, setHeight] = useState<number>(HEIGHT);

  const theme = useTheme();
  const { onFocus, onBlur, focused } = useAnimatedInputFocus({
    onFocusCallback,
    onBlurCallback,
  });

  const [previousLineCount, setPreviousLineCount] = useState<number>(1);

  const inputStatus = getInputStatus({ focused, hasError: !!error, hasValue: !!value });
  const displayClearCross = inputStatus === "error" || inputStatus === "focused";

  const handleContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const contentHeight = event.nativeEvent.contentSize.height;
      const currentLineCount = Math.round(contentHeight / LARGE_MODE_LINE_HEIGHT);

      if (currentLineCount !== previousLineCount) {
        const newHeight = HEIGHT + (currentLineCount - 1) * LARGE_MODE_LINE_HEIGHT;
        setHeight(newHeight);
        setPreviousLineCount(currentLineCount);
      }
    },
    [previousLineCount],
  );

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
          height: inputStatus !== "error" ? height : 48,
          paddingTop: largeMode ? 14 : 0,
          paddingBottom: largeMode ? 14 : 0,
          marginBottom: largeMode ? 40 : 0,
        }}
        baseInputContainerStyle={{
          paddingRight: displayClearCross ? (largeMode ? 20 : 8) : 14,
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
