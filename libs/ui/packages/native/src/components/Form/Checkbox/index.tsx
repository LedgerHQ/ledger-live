import React from "react";
import { Pressable } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../Text";
import Flex from "../../Layout/Flex";
import CheckAlone from "@ledgerhq/icons-ui/native/CheckAloneMedium";

import type { BaseTextProps } from "../../Text";

type CheckboxProps = {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  label?: BaseTextProps["children"];
};

const Square = styled(Flex).attrs({
  justifyContent: "center",
  alignItems: "center",
})<{ checked: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.neutral.c00};
  ${({ checked, theme }) =>
    checked
      ? `background-color: ${theme.colors.primary.c90};`
      : `border: 1px solid ${theme.colors.neutral.c50};`}
`;

const Checkbox = ({ checked, onChange, disabled, label }: CheckboxProps): JSX.Element => {
  const { colors, space } = useTheme();

  return (
    <Pressable onPress={onChange} disabled={disabled}>
      <Flex flexDirection="row" alignItems="center">
        <Square checked={checked}>
          {checked ? <CheckAlone size={13} color={colors.neutral.c00} /> : null}
        </Square>
        {label ? (
          <Text
            variant="body"
            color={checked ? colors.primary.c90 : colors.neutral.c100}
            style={{ marginLeft: space[2] }}
          >
            {label}
          </Text>
        ) : null}
      </Flex>
    </Pressable>
  );
};

export default Checkbox;
