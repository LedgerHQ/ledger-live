import React from "react";
import styled, { useTheme } from "styled-components/native";
import { Pressable } from "react-native";
import Text from "../../../components/Text";
import { Icon } from "../../../components/Icon";

const StyledPressable = styled(Pressable)`
  border-width: 1px;
  border-style: dotted;
  padding: 16px;
  margin-vertical: 8px;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  column-gap: 12;
`;

export const AddAccountButton = ({
  label,
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) => {
  const theme = useTheme();
  return (
    <StyledPressable
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => [
        {
          opacity: pressed ? 0.5 : 1.0,
          marginVertical: 12,
          width: "100%",
          borderColor: theme.colors.opacityDefault.c10,
        },
        disabled && { opacity: 0.5 },
      ]}
      hitSlop={6}
      onPress={() => onClick()}
      testID="add-new-account-button"
    >
      <Text variant="large">{label}</Text>
      <Icon name="Plus" size={20} color="neutral.c100" />
    </StyledPressable>
  );
};
