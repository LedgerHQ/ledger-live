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

const StyledRoot = styled.TouchableOpacity`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  color: ${props => props.theme.colors.neutral.c100};
  padding-left: ${props => props.theme.space[4]}px;
  padding-right: ${props => props.theme.space[4]}px;
  border-radius: ${props => props.theme.space[4]}px;
`;
