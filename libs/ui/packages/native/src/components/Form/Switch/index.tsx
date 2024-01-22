import React, { useCallback } from "react";
import {
  Pressable as BasePressable,
  Switch as NativeSwitch,
  SwitchProps as NativeSwitchProps,
} from "react-native";
import { useTheme } from "styled-components/native";
import Text from "../../Text";
import proxyStyled from "../../../components/styled";

export type SwitchProps = {
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  testID?: string;
} & Omit<Partial<NativeSwitchProps>, "onChange">;

const Pressable = proxyStyled(BasePressable).attrs({
  flexDirection: "row",
  alignItems: "center",
})``;

const Switch = ({ checked, onChange, disabled, label, testID }: SwitchProps): JSX.Element => {
  const { colors, space } = useTheme();

  const handlePress = useCallback(() => {
    if (disabled) return;
    onChange && onChange(!checked);
  }, [checked, disabled, onChange]);

  return (
    <Pressable onPress={handlePress}>
      <NativeSwitch
        trackColor={{
          false: colors.neutral.c50,
          true: colors.primary.c70,
        }}
        thumbColor={colors.neutral.c100}
        onValueChange={onChange}
        value={checked}
        disabled={disabled}
        ios_backgroundColor={colors.neutral.c50}
        testID={testID}
      />
      {label ? (
        <Text
          variant="body"
          color={checked ? colors.primary.c90 : colors.neutral.c100}
          style={{ marginLeft: space[3], flexShrink: 1 }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
};

export default Switch;
