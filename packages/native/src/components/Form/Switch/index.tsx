import React from "react";
import { Switch as NativeSwitch } from "react-native";
import { useTheme } from "styled-components/native";
import Text from "../../Text";
import Flex from "../../Layout/Flex";

type SwitchProps = {
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
};

const Switch = ({
  checked,
  onChange,
  disabled,
  label,
}: SwitchProps): JSX.Element => {
  const { colors, space } = useTheme();

  return (
    <Flex flexDirection="row" alignItems="center">
      <NativeSwitch
        trackColor={{
          false: colors.palette.neutral.c50,
          true: colors.palette.primary.c80,
        }}
        thumbColor={colors.palette.neutral.c00}
        onValueChange={onChange}
        value={checked}
        disabled={disabled}
        ios_backgroundColor={colors.palette.neutral.c50}
      />
      {label ? (
        <Text
          type="body"
          color={
            checked ? colors.palette.primary.c90 : colors.palette.neutral.c100
          }
          style={{ marginLeft: space[3] }}
        >
          {label}
        </Text>
      ) : null}
    </Flex>
  );
};

export default Switch;
