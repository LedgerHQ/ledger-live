import React from "react";
import styled from "styled-components/native";
import Flex from "../../../Layout/Flex/index";
import Text from "../../../Text/index";

import ChevronDown from "@ledgerhq/icons-ui/native/ChevronDown";
import { TouchableOpacity } from "react-native";
import { BaseStyledProps } from "src/components/styled";

const Container = styled(Flex)<{ color: string }>`
  border-left-width: 1px;
  border-left-color: ${(p) => p.color};
  width: 50%;
`;

const StyledTouchableOpacity = styled(TouchableOpacity)<BaseStyledProps>`
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: auto;
  padding: ${({ theme }) => theme.space[6]}px 0px ${({ theme }) => theme.space[6]}px
    ${({ theme }) => theme.space[6]}px;
`;

interface SelectProps {
  text: string;
  color: string;

  onPressSelect?: () => void;
}

export const SelectComponent = ({ text, color, onPressSelect }: SelectProps) => {
  return (
    <Container color={color}>
      <StyledTouchableOpacity onPress={onPressSelect}>
        <Text variant="large">{text}</Text>
        <ChevronDown />
      </StyledTouchableOpacity>
    </Container>
  );
};
