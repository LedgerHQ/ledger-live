import React from "react";
import styled, { useTheme } from "styled-components/native";
import FlexBox from "../../Layout/Flex";
import {
  TextProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import Text from "../../Text";
import CloseMedium from "@ledgerhq/icons-ui/native/CloseMedium";

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
    p.variant === "primary" ? p.theme.colors.primary.c90 : "transparent"};
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
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
    variant === "primary" ? colors.neutral.c00 : colors.neutral.c100;

  return (
    <NotificationContainer variant={variant}>
      <FlexBox>
        <Icon size={18} color={color || textColor} />
      </FlexBox>
      <FlexBox ml={16} flexShrink={1}>
        <Text
          variant={"body"}
          fontWeight={"medium"}
          color={color || textColor}
          numberOfLines={numberOfLines}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            variant={"body"}
            fontWeight={"medium"}
            color={
              color ||
              (variant === "primary" ? colors.neutral.c00 : colors.neutral.c80)
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
              variant={"body"}
              fontWeight={"semiBold"}
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
