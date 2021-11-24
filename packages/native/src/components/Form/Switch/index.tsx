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
          false: colors.neutral.c50,
          true: colors.primary.c80,
        }}
        thumbColor={colors.neutral.c00}
        onValueChange={onChange}
        value={checked}
        disabled={disabled}
        ios_backgroundColor={colors.neutral.c50}
      />
      {label ? (
        <Text
          variant="body"
          color={checked ? colors.primary.c90 : colors.neutral.c100}
          style={{ marginLeft: space[3] }}
        >
          {label}
        </Text>
      ) : null}
    </Flex>
  );
};

export default Switch;
