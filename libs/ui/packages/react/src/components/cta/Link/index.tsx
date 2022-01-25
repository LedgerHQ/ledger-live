import React from "react";
import styled from "styled-components";
import { getLinkColors } from "./getLinkStyle";
import { ctaIconSize, ctaTextType } from "../getCtaStyle";
import { Text } from "../../asorted";
import { TextProps } from "../../asorted/Text";
import baseStyled, { BaseStyledProps } from "../../styled";

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  BaseStyledProps & {
    /**
     * Component that takes `{size: number; color?: string}` as props
     */
    Icon?: React.ComponentType<{ size: number; color?: string }>;
    /**
     * Affects the colors of the text, icon & underline, can be overriden by the `color` prop
     */
    type?: "main" | "shade" | "color";
    /**
     * Affect the font variant & icon size
     */
    size?: "small" | "medium" | "large";
    /**
     * Color of the link, overrides colors defined by the `type` prop
     */
    color?: string;
    /**
     * Props passed to the rendered text
     */
    textProps?: TextProps;
    /**
     * If true text will always be underlined, else it will be underlined only on hover
     */
    alwaysUnderline?: boolean;
    /**
     * Position of the icon relative to the text
     */
    iconPosition?: "right" | "left";
    disabled?: boolean;
    children?: React.ReactNode;
  };

export const DEFAULT_ICON_POSITION = "right";
export const DEFAULT_SIZE = "medium";
export const DEFAULT_TYPE = "main";

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

const LinkContainer = ({
  Icon,
  iconPosition = DEFAULT_ICON_POSITION,
  children,
  color,
  size = DEFAULT_SIZE,
  textProps,
}: LinkProps): React.ReactElement => {
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
  const { type = DEFAULT_TYPE, size = DEFAULT_SIZE, color } = props;
  return (
    <Base color={color} {...props}>
      <LinkContainer {...props} type={type} size={size} />
    </Base>
  );
};

export default Link;
