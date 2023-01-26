import { Flex, Icons } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";
import styled from "@ledgerhq/native-ui/components/styled";

const StyledEmpty = styled(Flex)`
  border-radius: 50px;
  height: 24px;
  width: 24px;
  border-width: 2px;
  border-color: ${props => props.theme.colors.neutral.c90};
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const StyledChecked = styled(Flex)`
  border-radius: 50px;
  height: 24px;
  width: 24px;
  background-color: ${props => props.theme.colors.primary.c80};
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

type Props = {
  isSelected: boolean;
};

export const NftSelectionCheckbox = ({ isSelected }: Props) => {
  const { colors } = useTheme();

  if (isSelected) {
    return (
      <StyledChecked>
        <Icons.CheckTickMedium size={16} color={colors.neutral.c00} />
      </StyledChecked>
    );
  }

  return <StyledEmpty />;
};
