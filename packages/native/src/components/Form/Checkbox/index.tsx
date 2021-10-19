import React from "react";
import { Pressable } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../Text";
import Flex from "../../Layout/Flex";
import CheckAlone from "../../../assets/icons/CheckAloneMedium";

type CheckboxProps = {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  label?: string;
};

const Square = styled(Flex).attrs({
  justifyContent: "center",
  alignItems: "center",
})<{ checked: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.palette.neutral.c00};
  ${({ checked, theme }) =>
    checked
      ? `background-color: ${theme.colors.palette.primary.c90};`
      : `border: 1px solid ${theme.colors.palette.neutral.c50};`}
`;

const Checkbox = ({
  checked,
  onChange,
  disabled,
  label,
}: CheckboxProps): JSX.Element => {
  const { colors, space } = useTheme();

  return (
    <Pressable onPress={onChange} disabled={disabled}>
      <Flex flexDirection="row" alignItems="center">
        <Square checked={checked}>
          {checked ? (
            <CheckAlone size={13} color={colors.palette.neutral.c00} />
          ) : null}
        </Square>
        {label ? (
          <Text
            type="body"
            color={
              checked ? colors.palette.primary.c90 : colors.palette.neutral.c100
            }
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
