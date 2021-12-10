import React, { useState } from "react";
import styled, { css, StyledProps } from "styled-components";
import baseStyled, { BaseStyledProps } from "../../styled";
import { fontSize, border, BordersProps, compose } from "styled-system";
import fontFamily from "../../../styles/styled/fontFamily";
import { fontSizes } from "../../../styles/theme";
import { rgba } from "../../../styles/helpers";
import ChevronBottom from "@ledgerhq/icons-ui/react/ChevronBottomRegular";

export type ButtonVariants = "main" | "shade" | "error" | "color";
export type IconPosition = "right" | "left";
interface BaseProps extends BaseStyledProps, BordersProps {
  ff?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  variant?: ButtonVariants;
  outline?: boolean;
  iconPosition?: IconPosition;
  iconButton?: boolean;
  disabled?: boolean;
}

export interface ButtonProps extends BaseProps, React.RefAttributes<HTMLButtonElement> {
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  children?: React.ReactNode;
  onClick?: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
  iconSize?: number;
  style?: React.CSSProperties;
}
const IconContainer = styled.div<{
  iconPosition: IconPosition;
}>`
  display: inline-block;
  ${(p) => `${p.iconPosition === "left" ? "margin-right" : "margin-left"}: ${p.theme.space[4]}px;`}
  padding-top: 0.2em;
`;

const getVariantColors = (p: StyledProps<BaseProps>) => ({
  main: {
    outline: `
        border-color: ${p.theme.colors.neutral.c100};
        color: ${p.theme.colors.neutral.c100};
        background-color: ${p.theme.colors.neutral.c00};
        &:hover, &:focus {
          background-color: ${p.theme.colors.neutral.c20};
        }
        &:active {
          background-color: ${p.theme.colors.neutral.c30};
        }
      `,
    filled: `
        color: ${p.theme.colors.neutral.c00};
        background-color: ${p.theme.colors.neutral.c100};
        &:hover, &:focus {
          background-color: ${p.theme.colors.neutral.c90};
        }
      `,
  },
  shade: `
      border-color: ${p.theme.colors.neutral.c40};
      color: ${p.theme.colors.neutral.c100};
      background-color: ${p.theme.colors.neutral.c00};
      &:focus {
        border-color: ${p.theme.colors.primary.c80};
      }

      &:hover, &:focus {
        background-color: ${p.theme.colors.neutral.c20};
      }

      &:active {
        background-color: ${p.theme.colors.neutral.c30};
      }
    `,
  error: {
    outline: `
      border-color: ${p.theme.colors.error.c100};
      color: ${p.theme.colors.error.c100};
      background-color: ${p.theme.colors.neutral.c00};
      &:hover {
        background-color: ${p.theme.colors.error.c10};
      }
      &:active {
        background-color: ${p.theme.colors.error.c30};
      }
    `,
    filled: `
      color: ${p.theme.colors.neutral.c00};
      background-color: ${p.theme.colors.error.c100};
      &:hover {
        background-color: ${p.theme.colors.error.c80};
      }
    `,
  },
  color: {
    outline: `
      border-color: ${p.theme.colors.primary.c80};
      color: ${p.theme.colors.primary.c80};
      background-color: ${p.theme.colors.neutral.c00};
      &:hover {
        background-color: ${p.theme.colors.primary.c10};
      }
      &:active {
        background-color: ${p.theme.colors.primary.c20};
      }
    `,
    filled: `
      color: ${p.theme.colors.neutral.c00};
      background-color: ${p.theme.colors.primary.c80};
      &:hover {
        background-color: ${p.theme.colors.primary.c70};
      }
    `,
  },
  disabled: {
    outline: `
        border-color: ${p.theme.colors.neutral.c50};
        color: ${p.theme.colors.neutral.c50};
        background-color: ${p.theme.colors.neutral.c00};
      `,
    filled: `
        color: ${p.theme.colors.neutral.c50};
        background-color: ${p.theme.colors.neutral.c30};
      `,
  },
  default: `
    color: ${p.theme.colors.neutral.c100};
    background-color: transparent;
    &:hover {
      text-decoration: underline;
    }
  `,
});

export const ButtonUnstyled = styled.button`
  all: unset;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`;

export const Base = baseStyled.button.attrs((p: BaseProps) => ({
  fontFamily: "Inter",
  fontSize: p.fontSize ?? 4,
}))<BaseProps>`
  background-color: transparent;
  border-color: transparent;
  border-radius: ${(p) => p.theme.space[13]}px;
  border-style: solid;
  border-width: ${(p) => (p.outline || p.variant === "shade" ? 1 : 0)}px;
  font-weight: 600;
  ${compose(fontFamily, fontSize, border)};
  height: ${(p) => p.theme.space[13]}px;
  line-height: ${(p) => p.theme.fontSizes[p.fontSize]}px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 2em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  position: relative;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  &:active {
    box-shadow: 0 0 0 4px ${(p) => rgba(p.theme.colors.primary.c60, 0.4)};
  }

  ${(p) => {
    const variants = getVariantColors(p);
    if (p.disabled) {
      return p.outline || p.variant === "shade"
        ? variants.disabled.outline
        : variants.disabled.filled;
    }

    const variant: ButtonVariants | "default" =
      p.variant ?? ("default" as ButtonVariants | "default");
    switch (variant) {
      case "main":
        return p.outline ? variants.main.outline : variants.main.filled;
      case "shade":
        return variants.shade;

      case "error":
        return p.outline ? variants.error.outline : variants.error.filled;

      case "color":
        return p.outline ? variants.color.outline : variants.color.filled;

      case "default":
      default:
        return variants.default;
    }
  }}
  ${(p) =>
    p.iconButton
      ? css`
          width: ${p.theme.space[13]}px;
          padding: 0;
          ${IconContainer} {
            margin: 0;
          }
        `
      : ""}
  ${(p) => p.theme.transition(["background-color", "color", "border-color", "box-shadow"], "0.2s")}
`;

const ContentContainer = styled.div``;

const Button = (
  { Icon, iconPosition = "right", iconSize = 16, children, onClick, ...props }: ButtonProps,
  ref?: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement => {
  return (
    <Base {...props} ref={ref} iconButton={!(Icon == null) && !children} onClick={onClick}>
      {iconPosition === "right" ? <ContentContainer>{children}</ContentContainer> : null}
      {Icon != null ? (
        <IconContainer iconPosition={iconPosition}>
          <Icon size={iconSize || fontSizes[props.fontSize ?? 4]} />
        </IconContainer>
      ) : null}
      {iconPosition === "left" ? <ContentContainer>{children}</ContentContainer> : null}
    </Base>
  );
};
const ButtonWithRef = React.forwardRef(Button) as unknown as typeof Button;

export type ButtonExpandProps = React.PropsWithChildren<
  ButtonProps & {
    onToggle?: (arg0: boolean) => void;
  }
>;

const StyledButtonExpand = styled(ButtonWithRef).attrs((props) => ({
  Icon: props.Icon != null || ChevronBottom,
  iconPosition: props.iconPosition || "right",
}))<{ expanded: boolean }>`
  ${IconContainer} {
    transition: transform 0.25s;
    ${(p) => (p.expanded ? "transform: rotate(180deg)" : "")}
  }
`;
export function ButtonExpand(
  { onToggle, onClick, ...props }: ButtonExpandProps,
  ref?: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  return (
    <StyledButtonExpand
      {...props}
      ref={ref}
      expanded={expanded}
      onClick={(event: React.SyntheticEvent<HTMLButtonElement>) => {
        setExpanded((expanded) => !expanded);
        onToggle != null && onToggle(!expanded);
        onClick != null && onClick(event);
      }}
    />
  );
}

Button.Unstyled = ButtonUnstyled;
Button.Expand = React.forwardRef(ButtonExpand);
ButtonWithRef.Unstyled = Button.Unstyled;
ButtonWithRef.Expand = Button.Expand;
export default ButtonWithRef;
