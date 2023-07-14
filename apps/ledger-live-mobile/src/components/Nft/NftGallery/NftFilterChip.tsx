import React, { FC } from "react";
import { Icon, Text } from "@ledgerhq/native-ui";
import styled from "@ledgerhq/native-ui/components/styled";
import { useTheme } from "styled-components/native";

interface Props {
  readonly children?: string;
  readonly icon?: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

const NftFilterChip: FC<Props> = ({ onPress, children, icon, ...rest }) => {
  const { colors } = useTheme();
  return (
    <StyledRoot onPress={onPress} {...rest}>
      {icon ? <StyledIcon name={icon} color={colors.neutral.c100} size={20} /> : null}
      {children ? <Text variant="paragraph">{children}</Text> : null}
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

const StyledIcon = styled(Icon)`
  color: ${props => props.theme.colors.neutral.c100};
`;
