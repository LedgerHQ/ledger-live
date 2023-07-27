import { Flex, Box, Text, IconsLegacy, rgba } from "@ledgerhq/native-ui";
import React, { FC } from "react";
import { TouchableOpacity, View } from "react-native";
import styled, { useTheme } from "styled-components/native";

interface Props {
  readonly style?: React.ComponentProps<typeof TouchableOpacity>["style"];
  readonly leftIcon: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly onPress?: React.ComponentProps<typeof TouchableOpacity>["onPress"];
  readonly primary?: boolean;
  readonly testID?: string;
}

const NftLink: FC<Props> = ({
  style,
  leftIcon,
  rightIcon,
  title,
  subtitle,
  onPress,
  primary,
  ...rest
}) => (
  <NftLinkRoot style={style} onPress={onPress} {...rest}>
    <Flex flexDirection="row" alignItems="center">
      <Box mr={16}>{leftIcon}</Box>
      <Flex flexDirection="column">
        <Text fontWeight="semiBold" fontSize={16} color={primary ? "primary.c90" : "neutral.c100"}>
          {title}
        </Text>
        {subtitle && (
          <Text fontSize={13} color={primary ? "primary.c90" : "neutral.c100"}>
            {subtitle}
          </Text>
        )}
      </Flex>
    </Flex>
    {rightIcon}
  </NftLinkRoot>
);

const NftLinkRoot = styled(TouchableOpacity)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export default NftLink;

interface NftLinkRoundIconProps {
  readonly icon: string;
}

export const NftLinkRoundIcon: FC<NftLinkRoundIconProps> = ({ icon }) => {
  const Icon = IconsLegacy[icon];
  const { colors } = useTheme();
  return (
    <NftLinkRoundIconRoot style={[{ backgroundColor: rgba(colors.primary.c90, 0.1) }]}>
      <Icon size={16} color={colors.primary.c90} />
    </NftLinkRoundIconRoot>
  );
};

const NftLinkRoundIconRoot = styled(View)`
  height: 36px;
  width: 36px;
  border-radius: 36px;
  justify-content: center;
  align-items: center;
`;
