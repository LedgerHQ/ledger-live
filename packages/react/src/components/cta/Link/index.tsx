import React from "react";
import styled from "styled-components";
import { getLinkColors } from "./getLinkStyle";
import { ctaIconSize, ctaTextType } from "../getCtaStyle";
import { Text } from "../../asorted";
import { TextProps } from "../../asorted/Text";
import baseStyled, { BaseStyledProps } from "../../styled";

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  BaseStyledProps & {
    Icon?: React.ComponentType<{ size: number; color?: string }>;
    type?: "main" | "shade" | "color";
    size?: "small" | "medium" | "large";
    color?: string;
    textProps?: TextProps;
    alwaysUnderline?: boolean;
    iconPosition?: "right" | "left";
    disabled?: boolean;
    children?: React.ReactNode;
  };

const IconContainer = styled.div<{
  iconPosition: "right" | "left";
  iconLink?: boolean;
}>`
  ${(p) =>
    p.iconLink ? "" : p.iconPosition === "left" ? `margin-right: 6px;` : `margin-left: 6px;`}
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Base = baseStyled.a<LinkProps>`
  color: ${({ color, theme, disabled, type = "main" }) =>
    color || getLinkColors(theme.colors)[disabled ? "disabled" : type]["default"]};
  cursor: pointer;
  display: inline-flex;
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;

  :hover {
    text-decoration: underline;
  }
  :active {
    color: ${({ color, theme, type = "main" }) =>
      color || getLinkColors(theme.colors)[type]["pressed"]};
    text-decoration: underline;
  }

  text-decoration: ${(p) => (p.alwaysUnderline ? "underline" : "none")};

`;

const LinkContainer = (props: LinkProps): React.ReactElement => {
  const { Icon, iconPosition = "right", children, color, size = "medium", textProps } = props;

  const text = (
    <Text
      variant={ctaTextType[size]}
      fontWeight="semiBold"
      color={color || "inherit"}
      {...textProps}
    >
      {children}
    </Text>
  );

  return (
    <>
      {iconPosition === "right" && children ? text : null}
      {Icon ? (
        <IconContainer iconLink={!children} iconPosition={iconPosition}>
          <Icon size={ctaIconSize[size]} color={color || "currentcolor"} />
        </IconContainer>
      ) : null}
      {iconPosition === "left" && children ? text : null}
    </>
  );
};

const Link = (props: LinkProps): React.ReactElement => {
  const { type = "main", size = "medium", color } = props;
  return (
    <Base color={color} {...props}>
      <LinkContainer {...props} type={type} size={size} />
    </Base>
  );
};

export default Link;
