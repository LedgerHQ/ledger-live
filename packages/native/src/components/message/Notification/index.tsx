import React from "react";
import styled, { useTheme } from "styled-components/native";
import FlexBox from "../../Layout/Flex";
import { TextProps, TouchableOpacity, TouchableOpacityProps } from "react-native";
import Text from "../../Text";
import CloseMedium from "@ledgerhq/icons-ui/native/CloseMedium";
import { Flex } from "../../Layout";
import { space } from "styled-system";
import { ExternalLinkMedium } from "@ledgerhq/icons-ui/native";

type Props = {
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  iconColor?: string;
  variant?: "primary" | "secondary";
  title: string;
  subtitle?: string;
  numberOfLines?: TextProps["numberOfLines"];
  onClose?: TouchableOpacityProps["onPress"];
  linkText?: string;
  onLinkPress?: TouchableOpacityProps["onPress"];
};

const NotificationContainer = styled.View<Partial<Props>>`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  ${(p) =>
    p.variant === "primary" &&
    `
     padding: 16px;
  `}
  background-color: ${(p) =>
    p.variant === "primary" ? p.theme.colors.primary.c90 : "transparent"};
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
`;

const ClosePressableExtendedBounds = styled.TouchableOpacity.attrs({
  p: 5,
  m: -5,
})`
  ${space};
`;

export default function Notification({
  Icon,
  iconColor,
  variant = "primary",
  numberOfLines,
  title,
  subtitle,
  onClose,
  linkText,
  onLinkPress,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const textColor = variant === "primary" ? colors.neutral.c00 : colors.neutral.c100;

  return (
    <NotificationContainer variant={variant}>
      {Icon && (
        <FlexBox mr={16}>
          <Icon size={20} color={iconColor || textColor} />
        </FlexBox>
      )}
      <FlexBox flexShrink={1}>
        <Text
          variant={"body"}
          fontWeight={"medium"}
          color={textColor}
          numberOfLines={numberOfLines}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            variant={"body"}
            fontWeight={"medium"}
            color={variant === "primary" ? colors.neutral.c00 : colors.neutral.c80}
            mt={2}
          >
            {subtitle}
          </Text>
        )}
        {linkText && onLinkPress && (
          <Flex mt={3}>
            <TouchableOpacity onPress={onLinkPress}>
              <Flex flexDirection={"row"} alignItems={"center"}>
                <Text variant={"body"} fontWeight={"semiBold"} color={textColor} mr={3}>
                  {linkText}
                </Text>
                <ExternalLinkMedium size={16} color={textColor} />
              </Flex>
            </TouchableOpacity>
          </Flex>
        )}
      </FlexBox>
      {onClose && (
        <FlexBox marginLeft={"auto"} pl={16}>
          <ClosePressableExtendedBounds onPress={onClose}>
            <CloseMedium size={14} color={textColor} />
          </ClosePressableExtendedBounds>
        </FlexBox>
      )}
    </NotificationContainer>
  );
}
