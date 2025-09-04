// Fixed TypeScript 5.9 NFT feature compatibility - feature being deprecated
import React, { FC } from "react";
import { Text } from "@ledgerhq/native-ui";
import styled from "@ledgerhq/native-ui/components/styled";

interface Props {
  onPress: () => void;
  testID?: string;
  children?: React.ReactNode;
}

const NftFilterChip: FC<Props> = ({ onPress, children, ...rest }) => {
  return (
    <StyledRoot onPress={onPress} {...rest}>
      {typeof children === "string" ? <Text variant="paragraph">{children}</Text> : children}
    </StyledRoot>
  );
};

export default NftFilterChip;

/* eslint-disable @typescript-eslint/no-explicit-any */
const StyledRoot = styled.TouchableOpacity`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  background-color: ${(p: any) => p.theme.colors.opacityDefault.c05};
  color: ${(props: any) => props.theme.colors.neutral.c100};
  padding-left: ${(props: any) => props.theme.space[4]}px;
  padding-right: ${(props: any) => props.theme.space[4]}px;
  border-radius: ${(props: any) => props.theme.space[4]}px;
`;
/* eslint-enable @typescript-eslint/no-explicit-any */
