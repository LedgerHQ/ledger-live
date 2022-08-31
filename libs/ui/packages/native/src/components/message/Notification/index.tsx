import React from "react";
import styled, { useTheme } from "styled-components/native";
import FlexBox, { FlexBoxProps } from "../../Layout/Flex";
import { TextProps, TouchableOpacity, TouchableOpacityProps } from "react-native";
import Text from "../../Text";
import CloseMedium from "@ledgerhq/icons-ui/native/CloseMedium";
import { Flex } from "../../Layout";
import { space } from "styled-system";
import { ExternalLinkMedium } from "@ledgerhq/icons-ui/native";
import { TextVariants } from "src/styles/theme";
import { FontWeightTypes } from "src/components/Text/getTextStyle";

type NotificationVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "plain"
  | string;

type Props = {
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  iconColor?: string;
  variant?: NotificationVariant;
  title: string;
  subtitle?: string;
  numberOfLines?: TextProps["numberOfLines"];
  onClose?: TouchableOpacityProps["onPress"];
  linkText?: string;
  onLinkPress?: TouchableOpacityProps["onPress"];
};

const variantProps: Record<
  NotificationVariant,
  {
    bg: string;
    color: string;
    padding: string | number;
    linkColor?: string;
    iconMarginRight?: string | number;
    closeIconSize?: number;
    closeIconColor?: string;
    textVariant?: TextVariants;
    textFontWeight?: FontWeightTypes;
    borderRadius?: number;
  }
> = {
  primary: {
    bg: "primary.c90",
    color: "neutral.c00",
    padding: 6,
  },
  success: {
    bg: "success.c100",
    color: "neutral.c00",
    padding: 6,
  },
  warning: {
    bg: "warning.c100",
    color: "neutral.c00",
    padding: 6,
  },
  error: {
    bg: "error.c100",
    color: "neutral.c00",
    padding: 6,
  },
  neutral: {
    bg: "neutral.c30",
    color: "neutral.c100",
    linkColor: "primary.c80",
    padding: 6,
  },
  secondary: {
    bg: "transparent",
    color: "neutral.c100",
    padding: 0,
  },
  plain: {
    bg: "neutral.c100",
    color: "neutral.c00",
    padding: 6,
    iconMarginRight: "10px",
    closeIconSize: 20,
    closeIconColor: "neutral.c70",
    textVariant: "bodyLineHeight",
    textFontWeight: "semiBold",
    borderRadius: 8,
  },
};

const NotificationContainer = styled(FlexBox).attrs(
  (p: FlexBoxProps & { variant: NotificationVariant }) => ({
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    bg: variantProps[p.variant]?.bg ?? variantProps.primary.bg,
    p: variantProps[p.variant]?.padding,
    borderRadius: variantProps[p.variant]?.borderRadius ?? 1,
  }),
)``;

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
  const textColor = variantProps[variant]?.color ?? variantProps.primary.color;
  const linkColor = variantProps[variant]?.linkColor || textColor;
  const iconMarginRight = variantProps[variant]?.iconMarginRight ?? 16;
  const closeIconSize = variantProps[variant]?.closeIconSize ?? 14;
  const closeIconColor = variantProps[variant]?.closeIconColor ?? textColor;
  const textVariant = variantProps[variant]?.textVariant ?? "body";
  const textFontWeight = variantProps[variant]?.textFontWeight ?? "medium";

  return (
    <NotificationContainer variant={variant}>
      {Icon && (
        <FlexBox mr={iconMarginRight}>
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
            variant={textVariant}
            fontWeight={textFontWeight}
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
                <Text variant={textVariant} fontWeight={"semiBold"} color={linkColor} mr={3}>
                  {linkText}
                </Text>
                <ExternalLinkMedium size={16} color={linkColor} />
              </Flex>
            </TouchableOpacity>
          </Flex>
        )}
      </FlexBox>
      {onClose && (
        <FlexBox marginLeft={"auto"} pl={16}>
          <ClosePressableExtendedBounds onPress={onClose}>
            <CloseMedium size={closeIconSize} color={closeIconColor} />
          </ClosePressableExtendedBounds>
        </FlexBox>
      )}
    </NotificationContainer>
  );
}
