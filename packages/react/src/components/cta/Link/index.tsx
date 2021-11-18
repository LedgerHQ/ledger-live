import React from "react";
import styled from "styled-components";
import { getLinkColors } from "./getLinkStyle";
import { ctaIconSize, ctaTextType } from "../getCtaStyle";
import { Text } from "../../asorted";
import baseStyled, { BaseStyledProps } from "../../styled";

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  BaseStyledProps & {
    Icon?: React.ComponentType<{ size: number; color?: string }>;
    type?: "main" | "shade" | "color";
    size?: "small" | "medium" | "large";
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
  color: ${({ theme, disabled, type = "main" }) =>
    getLinkColors(theme.colors)[disabled ? "disabled" : type]["default"]};
  cursor: pointer;
  display: inline-flex;
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;

  text-decoration: none;

  :hover {
    text-decoration: underline;
  }
  :active {
    color: ${({ theme, type = "main" }) => getLinkColors(theme.colors)[type]["pressed"]};
    text-decoration: underline;
  }
`;

const LinkContainer = (props: LinkProps): React.ReactElement => {
  const { Icon, iconPosition = "right", children, size = "medium" } = props;
  return (
    <>
      {iconPosition === "right" && children ? (
        <Text variant={ctaTextType[size]} fontWeight="semiBold" color={"inherit"}>
          {children}
        </Text>
      ) : null}
      {Icon ? (
        <IconContainer iconLink={!children} iconPosition={iconPosition}>
          <Icon size={ctaIconSize[size]} color={"currentcolor"} />
        </IconContainer>
      ) : null}
      {iconPosition === "left" && children ? (
        <Text variant={ctaTextType[size]} fontWeight="semiBold" color={"inherit"}>
          {children}
        </Text>
      ) : null}
    </>
  );
};

const Link = (props: LinkProps): React.ReactElement => {
  const { type = "main", size = "medium" } = props;
  return (
    <Base {...props}>
      <LinkContainer {...props} type={type} size={size} />
    </Base>
  );
};

export default Link;
