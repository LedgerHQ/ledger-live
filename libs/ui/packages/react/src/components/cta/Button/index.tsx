import React, { useState, useMemo } from "react";
import styled, { css, StyledProps } from "styled-components";
import baseStyled, { BaseStyledProps } from "../../styled";
import { fontSize, border, BordersProps, compose } from "styled-system";
import fontFamily from "../../../styles/styled/fontFamily";
import { fontSizes } from "../../../styles/theme";
import { rgba } from "../../../styles/helpers";
import ChevronBottom from "@ledgerhq/icons-ui/react/ChevronBottomMedium";

export type ButtonVariants = "main" | "shade" | "error" | "color" | "neutral";
export type IconPosition = "right" | "left";
interface BaseProps extends BaseStyledProps, BordersProps {
  ff?: string;
  color?: string;
  backgroundColor?: string;
  size?: "small" | "medium" | "large";
  fontSize?: number;
  variant?: ButtonVariants;
  outline?: boolean;
  iconPosition?: IconPosition;
  iconButton?: boolean;
  disabled?: boolean;
  whiteSpace?: string;
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
        background-color: transparent;
        &:hover, &:focus {
          background-color: ${rgba(p.theme.colors.neutral.c100, 0.03)};
        }
        &:active {
          background-color: ${rgba(p.theme.colors.neutral.c100, 0.05)};
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
      background-color: transparent;
      &:hover {
        background-color: ${rgba(p.theme.colors.error.c100, 0.02)};
      }
      &:active {
        background-color: ${rgba(p.theme.colors.error.c100, 0.05)};
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
  neutral: `
    color: ${p.theme.colors.neutral.c100};
    background-color: ${p.theme.colors.neutral.c30};
    &:hover {
      background-color: ${p.theme.colors.neutral.c40};
    }
  `,
  color: {
    outline: `
      border-color: ${p.theme.colors.primary.c80};
      color: ${p.theme.colors.primary.c80};
      background-color: transparent;
      &:hover {
        background-color: ${rgba(p.theme.colors.primary.c100, 0.02)};
      }
      &:active {
        background-color: ${rgba(p.theme.colors.primary.c100, 0.05)};
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
        background-color: transparent;
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

export const ButtonUnstyled = baseStyled.button`
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
  line-height: ${(p) => p.theme.fontSizes[p.fontSize]}px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  ${(p) => buttonSizeStyle[p.size || "medium"]}
  text-overflow: ellipsis;
  white-space: ${(p) => (p.whiteSpace ? p.whiteSpace : "nowrap")};
  max-width: 100%;
  position: relative;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  &:active {
    box-shadow: 0 0 0 4px ${(p) => rgba(p.theme.colors.primary.c60, 0.4)};
  }
  &:focus, &:hover {
    box-shadow: 0 0 0 2px ${(p) => rgba(p.theme.colors.primary.c60, 0.4)};
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

      case "neutral":
        return variants.neutral;

      case "default":
      default:
        return variants.default;
    }
  }}
  ${(p) =>
    p.iconButton
      ? css`
          width: ${p.theme.space[12]}px;
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
  const iconNodeSize = iconSize || fontSizes[props.fontSize ?? 4];
  const IconNode = useMemo(() => Icon && <Icon size={iconNodeSize} />, [iconNodeSize, Icon]);

  return (
    <Base {...props} ref={ref} iconButton={!(Icon == null) && !children} onClick={onClick}>
      {iconPosition === "right" ? <ContentContainer>{children}</ContentContainer> : null}
      {IconNode && <IconContainer iconPosition={iconPosition}>{IconNode}</IconContainer>}
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

export const buttonSizeStyle: {
  [index: string]: {
    padding: string;
    height: string;
  };
} = {
  small: {
    padding: "0 20px",
    height: "32px",
  },
  medium: {
    padding: "0 24px",
    height: "40px",
  },
  large: {
    padding: "0 28px",
    height: "48px",
  },
};

Button.Unstyled = ButtonUnstyled;
Button.Expand = React.forwardRef(ButtonExpand);
ButtonWithRef.Unstyled = Button.Unstyled;
ButtonWithRef.Expand = Button.Expand;
export default ButtonWithRef;
