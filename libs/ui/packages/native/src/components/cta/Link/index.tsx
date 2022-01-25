import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../Text";
import { getLinkColors } from "./getLinkStyle";
import { ctaIconSize, ctaTextType } from "../getCtaStyle";

export type LinkProps = TouchableOpacityProps & {
  Icon?: React.ComponentType<{ size: number; color: string }>;
  type?: "main" | "shade" | "color";
  size?: "small" | "medium" | "large";
  iconPosition?: "right" | "left";
  disabled?: boolean;
  reversed?: boolean;
  children?: React.ReactNode;
};

const IconContainer = styled.View<{
  iconPosition: "right" | "left";
  iconLink?: boolean;
}>`
  ${(p) =>
    p.iconLink ? "" : p.iconPosition === "left" ? `margin-right: 6px;` : `margin-left: 6px;`}
`;

export const Base = styled(TouchableOpacity)`
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;
`;

const LinkContainer = (props: LinkProps): React.ReactElement => {
  const {
    Icon,
    iconPosition = "right",
    children,
    size = "medium",
    reversed,
    type = "main",
    disabled,
  } = props;
  const { colors } = useTheme();
  const colorValue =
    getLinkColors(colors)[reversed ? "reversed" : "default"][disabled ? "disabled" : type];

  return (
    <>
      {iconPosition === "right" && children ? (
        <Text variant={ctaTextType[size]} fontWeight={"semiBold"} color={colorValue}>
          {children}
        </Text>
      ) : null}
      {Icon ? (
        <IconContainer iconLink={!children} iconPosition={iconPosition}>
          <Icon size={ctaIconSize[size]} color={colorValue} />
        </IconContainer>
      ) : null}
      {iconPosition === "left" && children ? (
        <Text variant={ctaTextType[size]} fontWeight={"semiBold"} color={colorValue}>
          {children}
        </Text>
      ) : null}
    </>
  );
};

const Link = (props: LinkProps): React.ReactElement => {
  const { type = "main", size = "medium" } = props;
  return (
    <Base {...props} activeOpacity={0.5}>
      <LinkContainer {...props} type={type} size={size} />
    </Base>
  );
};

export default Link;
