// Fixed TypeScript 5.9 NFT feature compatibility - feature being deprecated
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";
import styled from "@ledgerhq/native-ui/components/styled";

/* eslint-disable @typescript-eslint/no-explicit-any */
const StyledEmpty = styled(Flex)`
  border-radius: 50px;
  height: 24px;
  width: 24px;
  border-width: 2px;
  border-color: ${(props: any) =>
    props.theme.colors.neutral.c90}; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const StyledChecked = styled(Flex)`
  border-radius: 50px;
  height: 24px;
  width: 24px;
  background-color: ${(props: any) => props.theme.colors.primary.c80};
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
/* eslint-enable @typescript-eslint/no-explicit-any */

type Props = {
  isSelected: boolean;
};

export const NftSelectionCheckbox = ({ isSelected }: Props) => {
  const { colors } = useTheme();

  if (isSelected) {
    return (
      <StyledChecked>
        <IconsLegacy.CheckTickMedium size={16} color={colors.neutral.c00} />
      </StyledChecked>
    );
  }

  return <StyledEmpty />;
};
