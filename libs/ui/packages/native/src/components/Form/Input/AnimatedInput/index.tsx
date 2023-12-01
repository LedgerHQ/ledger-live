import React, { useState, forwardRef, useEffect } from "react";
import { BaseInput } from "..";
import { type InputProps as BaseInputType } from "../BaseInput/index";
import styled, { useTheme } from "styled-components/native";
import { Flex } from "../../../Layout";
// import Text from "../../../Text";
import { StyleProp, TouchableOpacity, View, ViewProps, ViewStyle } from "react-native";
import { DeleteCircleFill } from "@ledgerhq/icons-ui/native";

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

type AnimatedInputClearCrossProps = BaseInputType & {
  ref?: React.RefObject<{ clear: () => void }>;
  displayClearCross: boolean;
};

const AnimatedInputClearCross = ({
  onChange,
  ref,
  displayClearCross,
}: AnimatedInputClearCrossProps) => {
  const handleClear = () => {
    onChange && onChange("");
    ref?.current && ref.current.clear();
  };

  const [showCross, setShowCross] = useState(displayClearCross);

  useEffect(() => {
    setTimeout(() => setShowCross(displayClearCross), 100);
  }, [displayClearCross]);

  return (
    <Flex height="100%" justifyContent="center" paddingRight="14px">
      {showCross && (
        <TouchableOpacity onPress={handleClear}>
          <DeleteCircleFill size="S" color="neutral.c50" />
        </TouchableOpacity>
      )}
    </Flex>
  );
};

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
        color={theme ? inputTextColor[inputStatus]({ theme }) : "black"}
        inputContainerStyle={{
          backgroundColor: "none",
          borderColor: theme ? inputStatusColors[inputStatus]({ theme }) : "black",
          borderRadius: 8,
          height: inputStatus !== "error" ? 56 : 48,
        }}
        baseInputContainerStyle={{
          paddingTop: 15,
          paddingBottom: 15,
          paddingLeft: 14,
          paddingRight: displayClearCross ? 8 : 14,
        }}
        renderRight={
          <AnimatedInputClearCross displayClearCross={displayClearCross} {...textInputProps} />
        }
        inputErrorContainerStyles={{
          marginLeft: 16,
          marginTop: 8,
          color: theme ? inputStatusColors[inputStatus]({ theme }) : "black",
        }}
        {...rest}
      />
    </InputContainer>
  );
};

export default forwardRef(AnimatedInput);
