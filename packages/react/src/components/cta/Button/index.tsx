import React, { useState } from "react";
import styled, { css, StyledProps } from "styled-components";
import { fontSize, color, border } from "styled-system";
import fontFamily from "../../../styles/styled/fontFamily";
import { fontSizes } from "../../../styles/theme";
import ChevronBottom from "@ledgerhq/icons-ui/react/ChevronBottomRegular";

export type ButtonTypes = "main" | "shade" | "error" | "color";
export type IconPosition = "right" | "left";
interface BaseProps extends BordersProps {
  ff?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  type?: ButtonTypes;
  outline?: boolean;
  iconPosition?: IconPosition;
  iconButton?: boolean;
  disabled?: boolean;
}

export interface ButtonProps extends BaseProps {
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  children?: React.ReactNode;
  onClick: (event?: React.SyntheticEvent<HTMLButtonElement>) => void;
  iconSize?: number;
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
        border-color: ${p.theme.colors.palette.neutral.c100};
        color: ${p.theme.colors.palette.neutral.c100};
        background-color: ${p.theme.colors.palette.neutral.c00};
        &:hover {
          background-color: ${p.theme.colors.palette.neutral.c20};
        }
        &:active {
          background-color: ${p.theme.colors.palette.neutral.c30};
        }
      `,
    filled: `
        color: ${p.theme.colors.palette.neutral.c00};
        background-color: ${p.theme.colors.palette.neutral.c100};
        &:hover {
          background-color: ${p.theme.colors.palette.neutral.c90};
        }
      `,
  },
  shade: `
      border-color: ${p.theme.colors.palette.neutral.c40};
      color: ${p.theme.colors.palette.neutral.c100};
      background-color: ${p.theme.colors.palette.neutral.c00};
      &:focus {
        border-color: ${p.theme.colors.palette.primary.c80};
      }

      &:hover {
        background-color: ${p.theme.colors.palette.neutral.c20};
      }

      &:active {
        background-color: ${p.theme.colors.palette.neutral.c30};
      }
    `,
  error: {
    outline: `
      border-color: ${p.theme.colors.palette.error.c100};
      color: ${p.theme.colors.palette.error.c100};
      background-color: ${p.theme.colors.palette.neutral.c00};
      &:hover {
        background-color: ${p.theme.colors.palette.error.c10};
      }
      &:active {
        background-color: ${p.theme.colors.palette.error.c30};
      }
    `,
    filled: `
      color: ${p.theme.colors.palette.neutral.c00};
      background-color: ${p.theme.colors.palette.error.c100};
      &:hover {
        background-color: ${p.theme.colors.palette.error.c80};
      }
    `,
  },
  color: {
    outline: `
      border-color: ${p.theme.colors.palette.primary.c80};
      color: ${p.theme.colors.palette.primary.c80};
      background-color: ${p.theme.colors.palette.neutral.c00};
      &:hover {
        background-color: ${p.theme.colors.palette.primary.c10};
      }
      &:active {
        background-color: ${p.theme.colors.palette.primary.c20};
      }
    `,
    filled: `
      color: ${p.theme.colors.palette.neutral.c00};
      background-color: ${p.theme.colors.palette.primary.c80};
      &:hover {
        background-color: ${p.theme.colors.palette.primary.c70};
      }
    `,
  },
  disabled: {
    outline: `
        border-color: ${p.theme.colors.palette.neutral.c50};
        color: ${p.theme.colors.palette.neutral.c50};
        background-color: ${p.theme.colors.palette.neutral.c00};
      `,
    filled: `
        color: ${p.theme.colors.palette.neutral.c50};
        background-color: ${p.theme.colors.palette.neutral.c30};
      `,
  },
});

export const Base = styled.button.attrs((p: BaseProps) => ({
  ff: "Inter|SemiBold",
  color: p.color ?? "palette.neutral.c100",
  fontSize: p.fontSize ?? 4,
}))<BaseProps>`
  background-color: transparent;
  border-color: transparent;
  border-radius: ${(p) => p.theme.space[13]}px;
  border-style: solid;
  border-width: ${(p) => (p.outline || p.type === "shade" ? 1 : 0)}px;
  ${fontFamily};
  ${fontSize};
  ${color};
  ${border};
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
  &:focus {
    box-shadow: 0 0 0 4px ${(p) => p.theme.colors.palette.primary.c60};
  }

  ${(p) => {
    const variants = getVariantColors(p);
    if (p.disabled) {
      return p.outline || p.type === "shade" ? variants.disabled.outline : variants.disabled.filled;
    }

    const type: ButtonTypes | "default" = p.type ?? ("default" as ButtonTypes | "default");
    switch (type) {
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
        return `
              &:hover {
                text-decoration: underline;
              }
            `;
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
  ${(p) => p.theme.transition(["background-color", "color", "border-color"])}
`;

const ContentContainer = styled.div``;

const Button = ({
  Icon,
  iconPosition = "right",
  iconSize = 16,
  children,
  onClick,
  ...props
}: ButtonProps): React.ReactElement => {
  return (
    // @ts-expect-error FIXME type button conflict
    <Base {...props} iconButton={!(Icon == null) && !children} onClick={onClick}>
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

export type ExpandButtonProps = React.PropsWithChildren<{
  onToggle?: (arg0: boolean) => void;
  onClick?: (arg0: React.SyntheticEvent<HTMLButtonElement>) => void;
}>;

const StyledExpandButton = styled(Button).attrs((props) => ({
  Icon: props.Icon != null || ChevronBottom,
  iconPosition: props.iconPosition || "right",
}))<{ expanded: boolean }>`
  ${IconContainer} {
    transition: transform 0.25s;
    ${(p) => (p.expanded ? "transform: rotate(180deg)" : "")}
  }
`;
export const ExpandButton = function ExpandButton({
  onToggle,
  onClick,
  ...props
}: ExpandButtonProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  return (
    <StyledExpandButton
      {...props}
      expanded={expanded}
      onClick={(event: React.SyntheticEvent<HTMLButtonElement>) => {
        setExpanded((expanded) => !expanded);
        onToggle != null && onToggle(!expanded);
        onClick != null && onClick(event);
      }}
    />
  );
};
export default Button;
