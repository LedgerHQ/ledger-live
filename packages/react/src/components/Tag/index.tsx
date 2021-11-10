import React from "react";
import { TextVariants } from "src/styles/theme";
import styled from "styled-components";
import { border, BorderProps, space, SpaceProps, color, ColorProps } from "styled-system";
import Text, { TextProps } from "../asorted/Text";

export type Size = "large" | "medium" | "small";
export type Type = "plain" | "opacity" | "outlined" | "outlinedOpacity";

export type Props = React.PropsWithChildren<
  {
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
  } & BorderProps &
    ColorProps
>;

function getColor({ type, active, disabled }: Props) {
  switch (type) {
    case "plain":
      if (disabled) return active ? "palette.neutral.c00" : "palette.neutral.c70";
      return active ? "palette.neutral.c00" : "palette.primary.c90";
    default:
      return disabled ? "palette.neutral.c70" : "palette.primary.c90";
  }
}

function getBgColor({ type, active, disabled }: Props) {
  switch (type) {
    case "plain":
      return active ? (disabled ? "palette.neutral.c70" : "palette.primary.c90") : undefined;
    case "opacity":
      return active ? (disabled ? "palette.neutral.c30" : "palette.primary.c20") : undefined;
    default:
      return;
  }
}

function getBorderColor({ type, active, disabled }: Props) {
  if (!active) return;
  switch (type) {
    case "outlined":
      return disabled ? "palette.neutral.c70" : "palette.primary.c90";
    case "outlinedOpacity":
      return disabled ? "palette.neutral.c40" : "palette.primary.c40";
  }
}

function getPadding({ size }: Props) {
  switch (size) {
    case "small":
      return "3px 5px";
    case "medium":
      return "6px 8px";
    case "large":
    default:
      return "9px 10px 10px";
  }
}

function getTextProps({ size }: Props): {
  variant: TextVariants;
  fontWeight?: string;
  uppercase?: boolean;
} {
  switch (size) {
    case "small":
    case "medium":
      return {
        variant: "tiny",
        fontWeight: "semiBold",
        uppercase: true,
      };
    case "large":
    default:
      return {
        variant: "extraSmall",
        fontWeight: "semiBold",
      };
  }
}

const TagContainer = styled.div.attrs((props: Props) => ({
  backgroundColor: props.bg || props.backgroundColor || getBgColor(props),
  color: props.color || getColor(props),
  borderColor: getBorderColor(props),
}))<Props & BorderProps & SpaceProps & ColorProps>`
  display: inline-flex;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  padding: ${(p) => getPadding(p)};
  ${border}
  ${space}
  ${color}
`;

export default function Tag({ children, textProps, size = "large", ...props }: Props): JSX.Element {
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
