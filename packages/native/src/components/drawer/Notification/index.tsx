import React from "react";
import styled, { useTheme } from "styled-components/native";
import FlexBox from "@components/Layout/Flex";
import {
  TextProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import Text from "@components/Text";
import CloseMedium from "@ui/assets/icons/CloseMedium";

type Props = {
  Icon: React.ComponentType<{ size: number; color?: string }>;
  color?: string;
  variant?: "primary" | "secondary";
  title: string;
  subtitle?: string;
  numberOfLines?: TextProps["numberOfLines"];
  onClose?: TouchableOpacityProps["onPress"];
  onLearnMore?: TouchableOpacityProps["onPress"];
};

const NotificationContainer = styled.View<Partial<Props>>`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  background-color: ${(p) =>
    p.variant === "primary"
      ? p.theme.colors.palette.primary.c90
      : "transparent"};
  border-radius: 4px;
`;

export default function Notification({
  Icon,
  color,
  variant = "primary",
  numberOfLines,
  title,
  subtitle,
  onClose,
  onLearnMore,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  const textColor =
    variant === "primary"
      ? colors.palette.neutral.c00
      : colors.palette.neutral.c100;

  return (
    <NotificationContainer variant={variant}>
      <FlexBox>
        <Icon size={18} color={color || textColor} />
      </FlexBox>
      <FlexBox ml={16} flexShrink={1}>
        <Text
          type={"body"}
          fontWeight={"medium"}
          color={color || textColor}
          numberOfLines={numberOfLines}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            type={"body"}
            fontWeight={"medium"}
            color={
              color ||
              (variant === "primary"
                ? colors.palette.neutral.c00
                : colors.palette.neutral.c80)
            }
            mt={"2px"}
            mb={"2px"}
          >
            {subtitle}
          </Text>
        )}
        {onLearnMore && (
          <TouchableOpacity onPress={onLearnMore}>
            <Text
              type={"body"}
              fontWeight={"semibold"}
              color={color || textColor}
            >
              Learn more
            </Text>
          </TouchableOpacity>
        )}
      </FlexBox>
      {onClose && (
        <FlexBox marginLeft={"auto"} pl={16}>
          <TouchableOpacity onPress={onClose}>
            <CloseMedium size={14} color={color || textColor} />
          </TouchableOpacity>
        </FlexBox>
      )}
    </NotificationContainer>
  );
}
