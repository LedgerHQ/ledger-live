import React from "react";
import { border, BorderProps } from "styled-system";
import Text, { TextProps } from "../asorted/Text";
import baseStyled, { BaseStyledProps } from "../styled";

export type Size = "large" | "medium" | "small" | "tiny";
export type Type = "plain" | "opacity" | "outlined" | "outlinedOpacity";

export type TagProps = BaseStyledProps &
  React.HTMLAttributes<HTMLDivElement> &
  BorderProps &
  React.PropsWithChildren<{
    /**
     * Changes the appearance based on the active state.
     */
    active?: boolean;
    /**
     * Tag style.
     */
    type?: Type;
    /**
     * Size of the tag, affects the padding and the casing (uppercase for small and medium)
     */
    size?: Size;
    /**
     * Props passed to the text component, overriding props set internally by Tag component
     */
    textProps?: TextProps;

    disabled?: boolean;
  }>;

function getColor({ type, active, disabled }: TagProps) {
  switch (type) {
    case "plain":
      if (disabled) return active ? "neutral.c00" : "neutral.c70";
      return active ? "neutral.c00" : "primary.c90";
    default:
      return disabled ? "neutral.c70" : "primary.c90";
  }
}

function getBgColor({ type, active, disabled }: TagProps) {
  switch (type) {
    case "plain":
      return active ? (disabled ? "neutral.c70" : "primary.c90") : undefined;
    case "opacity":
      return active ? (disabled ? "neutral.c30" : "primary.c20") : undefined;
    default:
      return;
  }
}

function getBorderColor({ type, active, disabled }: TagProps) {
  if (!active) return;
  switch (type) {
    case "outlined":
      return disabled ? "neutral.c70" : "primary.c90";
    case "outlinedOpacity":
      return disabled ? "neutral.c40" : "primary.c40";
  }
}

function getPadding({ size }: TagProps) {
  // Padding is 1px less than what's indicated in the design because of the 1px wide border.
  switch (size) {
    case "tiny":
      return "1px 3px";
    case "small":
      return "2px 4px";
    case "medium":
      return "5px 7px";
    case "large":
    default:
      return "8px 9px 9px";
  }
}

function getTextProps({ size }: TagProps): TextProps {
  switch (size) {
    case "tiny":
    case "small":
    case "medium":
      return {
        variant: "tiny",
        fontWeight: "semiBold",
        lineHeight: "normal",
      };
    case "large":
    default:
      return {
        variant: "extraSmall",
        fontWeight: "semiBold",
      };
  }
}

const TagContainer = baseStyled.div.attrs<TagProps, TagProps>(props => ({
  backgroundColor: props.bg || props.backgroundColor || getBgColor(props),
  color: props.color || getColor(props),
  borderColor: getBorderColor(props),
}))`
  display: inline-flex;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: ${p => `${p.theme.radii[1]}px`};
  padding: ${p => getPadding(p)};
  ${border}
`;

export default function Tag({
  children,
  textProps,
  size = "large",
  ...props
}: TagProps): React.JSX.Element {
  const textColor = getColor(props);
  const baseTextProps = getTextProps({ size, ...props });
  return (
    <TagContainer size={size} {...props}>
      <Text {...baseTextProps} color={textColor} {...(textProps ? textProps : {})}>
        {children}
      </Text>
    </TagContainer>
  );
}
