import React, { PureComponent } from "react";
import styled, { ThemedStyledProps, DefaultTheme } from "styled-components";
import {
  space,
  fontSize,
  fontWeight,
  color,
  SpaceProps,
  ColorProps,
  FontSizeProps,
  FontWeightProps,
} from "styled-system";
import noop from "lodash/noop";
import get from "lodash/get";
import { track } from "~/renderer/analytics/segment";
import { isGlobalTabEnabled } from "~/config/global-tab";
import { darken, lighten, rgba } from "~/renderer/styles/helpers";
import fontFamily from "~/renderer/styles/styled/fontFamily";
import { focusedShadowStyle } from "~/renderer/components/Box/Tabbable";
import Spinner from "~/renderer/components/Spinner";

type BaseComponentProps = BaseProps & { ff?: string; fullWidth?: boolean };
type ButtonStyle = (p: ThemedStyledProps<BaseComponentProps, DefaultTheme>) => string;
const buttonStyles: Record<string, Record<string, ButtonStyle>> = {
  default: {
    default: p => `
      box-shadow: ${p.isFocused ? focusedShadowStyle : ""};
      ${p.disabled ? `color: ${p.theme.colors.palette.text.shade20}` : ""}
    `,
    active: p => `
      background: ${rgba(p.theme.colors.palette.divider, 0.2)};
    `,
    hover: p => `
      background: ${rgba(p.theme.colors.palette.divider, 0.1)};
    `,
  },
  primary: {
    default: p => `
      background: ${
        p.disabled
          ? `${p.theme.colors.palette.action.disabled} !important`
          : p.inverted
          ? p.theme.colors.palette.primary.contrastText
          : p.theme.colors.palette.primary.main
      };
      color: ${
        p.disabled
          ? p.theme.colors.palette.text.shade20
          : p.inverted
          ? p.theme.colors.palette.primary.main
          : p.theme.colors.palette.primary.contrastText
      };
      box-shadow: ${
        p.isFocused
          ? `
          0 0 0 1px ${darken(p.theme.colors.palette.primary.main, 0.3)} inset,
          0 0 0 1px ${rgba(p.theme.colors.palette.primary.main, 0.5)},
          0 0 0 3px ${rgba(p.theme.colors.palette.primary.main, 0.3)};`
          : ""
      }
    `,
    hover: p => `
       background: ${
         p.inverted
           ? darken(p.theme.colors.palette.primary.contrastText, 0.05)
           : lighten(p.theme.colors.palette.primary.main, 0.05)
       };
     `,
    active: p => `
       background: ${
         p.inverted
           ? darken(p.theme.colors.palette.primary.contrastText, 0.1)
           : darken(p.theme.colors.palette.primary.main, 0.1)
       };
     `,
  },
  danger: {
    default: p => `
      background: ${
        p.disabled
          ? `${p.theme.colors.palette.action.disabled} !important`
          : p.theme.colors.alertRed
      };
      color: ${
        p.disabled
          ? p.theme.colors.palette.text.shade20
          : p.theme.colors.palette.primary.contrastText
      };
      box-shadow: ${
        p.isFocused
          ? `
          0 0 0 1px ${darken(p.theme.colors.alertRed, 0.3)} inset,
          0 0 0 1px ${rgba(p.theme.colors.alertRed, 0.5)},
          0 0 0 3px ${rgba(p.theme.colors.alertRed, 0.3)};
        `
          : ""
      }
    `,
    hover: p => `
      background: ${lighten(p.theme.colors.alertRed, 0.1)};
     `,
    active: p => `
      background: ${darken(p.theme.colors.alertRed, 0.1)};
     `,
  },
  lighterPrimary: {
    default: p => `
      background: ${
        p.disabled
          ? `${p.theme.colors.palette.action.disabled} !important`
          : p.theme.colors.palette.action.hover
      };
      color: ${
        p.disabled
          ? `${p.theme.colors.palette.text.shade20} !important`
          : p.theme.colors.palette.primary.main
      };
      box-shadow: ${
        p.isFocused
          ? `
          0 0 0 1px ${darken(p.theme.colors.palette.primary.main, 0.3)} inset,
          0 0 0 1px ${rgba(p.theme.colors.palette.primary.main, 0.5)},
          0 0 0 3px ${rgba(p.theme.colors.palette.primary.main, 0.3)};`
          : ""
      }
    `,
    hover: p => `
       background: ${lighten(p.theme.colors.palette.action.hover, 0.05)};
     `,
    active: p => `
       background: ${darken(p.theme.colors.palette.action.hover, 0.1)};
     `,
  },
  lighterDanger: {
    default: p => `
      color: ${
        p.disabled
          ? `${p.theme.colors.palette.action.disabled} !important`
          : p.theme.colors.alertRed
      };
    `,
    hover: p => `
      color: ${p.theme.colors.alertRed};
     `,
    active: p => `
      color: ${p.theme.colors.alertRed};
     `,
  },
  outline: {
    default: p => {
      const c = p.outlineColor
        ? get(p.theme.colors, p.outlineColor) || p.outlineColor
        : p.theme.colors.palette.primary.main;
      return `
        background: transparent;
        border: 1px solid ${c};
        color: ${c};
        box-shadow: ${
          p.isFocused
            ? `
            0 0 0 3px ${rgba(c, 0.3)};`
            : ""
        }
      `;
    },
    hover: p => {
      const c = p.outlineColor
        ? get(p.theme.colors, p.outlineColor) || p.outlineColor
        : p.theme.colors.palette.primary.main;
      return `
        background: ${rgba(c, 0.1)};
      `;
    },
    active: p => {
      const c = p.outlineColor
        ? get(p.theme.colors, p.outlineColor) || p.outlineColor
        : p.theme.colors.palette.primary.main;
      return `
        background: ${rgba(c, 0.15)};
        color: ${darken(
          p.outlineColor
            ? get(p.theme.colors, p.outlineColor) || p.outlineColor
            : p.theme.colors.palette.primary.main,
          0.1,
        )};
        border-color: ${darken(
          p.outlineColor
            ? get(p.theme.colors, p.outlineColor) || p.outlineColor
            : p.theme.colors.palette.primary.main,
          0.1,
        )};
      `;
    },
  },
  outlineGrey: {
    default: p => `
      background: transparent;
      border: 1px solid ${p.theme.colors.palette.text.shade60};
      color: ${p.theme.colors.palette.text.shade60};
      box-shadow: ${p.isFocused ? focusedShadowStyle : ""}
    `,
    active: p => `
      color: ${darken(p.theme.colors.palette.text.shade60, 0.1)};
      border-color: ${darken(p.theme.colors.palette.text.shade60, 0.1)};
    `,
  },
  icon: {
    default: () => `
      ${/*  @ts-expect-error TODO: isn't this weird? fontSize is a styled-system function */ ""}
      font-size: ${fontSize[3]}px;
      ${/*  @ts-expect-error TODO: isn't this weird? space is a styled-system function */ ""}
      padding-left: ${space[1]}px;
      ${/*  @ts-expect-error TODO: isn't this weird? space is a styled-system function */ ""}
      padding-right: ${space[1]}px;
    `,
  },
  isLoading: {
    default: () => `
      padding-left: 40px;
      padding-right: 40px;
      pointer-events: none;
      opacity: 0.7;
    `,
  },
};
function getStyles(props: BaseComponentProps, state: string) {
  let output = "";
  let hasModifier = false;
  for (const s in buttonStyles) {
    if (buttonStyles.hasOwnProperty(s) && props[s as keyof typeof props] === true) {
      const style = buttonStyles[s][state];
      if (style) {
        hasModifier = true;
        output += style(props as ThemedStyledProps<BaseComponentProps, DefaultTheme>);
      }
    }
  }
  if (!hasModifier) {
    const defaultStyle = buttonStyles.default[state];
    if (defaultStyle) {
      output += defaultStyle(props as ThemedStyledProps<BaseComponentProps, DefaultTheme>) || "";
    }
  }
  return output;
}
const LoadingWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ChildrenWrapper = styled.div<{ isLoading?: boolean }>`
  opacity: ${p => (p.isLoading ? 0 : 1)};
  flex-shrink: 1;
  display: flex;
  align-items: center;
`;

type BaseProps = {
  fontSize?: number;
  small?: boolean;
  isFocused?: boolean;
  disabled?: boolean;
  inverted?: boolean;
  outlineColor?: string;
} & SpaceProps &
  ColorProps &
  FontSizeProps &
  FontWeightProps;

export const Base = styled.button.attrs<BaseProps>(p => ({
  ff: "Inter|SemiBold",
  fontSize: p.fontSize || (!p.small ? 4 : 3),
  px: p.px ? p.px : !p.small ? 4 : 3,
  py: !p.small ? 2 : 0,
  color: p.color || p.theme.colors.palette.text.shade60,
  bg: "transparent",
}))<BaseComponentProps>`
  ${space};
  ${color};
  ${fontSize};
  ${fontWeight};
  ${fontFamily};
  border: none;
  display: flex;
  overflow: hidden;
  position: relative;
  flex-direction: row;
  align-items: center;
  border-radius: ${p => p.theme.radii[1]}px;
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  height: ${p => (p.small ? 34 : 40)}px;
  pointer-events: ${p => (p.disabled ? "none" : "")};
  width: ${p => (p.fullWidth ? "100%" : "auto")};
  outline: none;

  ${p => getStyles(p, "default")};

  &:hover {
    ${p => getStyles(p, "hover")};
  }
  &:active {
    ${p => getStyles(p, "active")};
  }
  &:focus {
    ${p => getStyles(p, "focus")};
  }
`;
export type Props = {
  children?: React.ReactNode;
  icon?: boolean;
  primary?: boolean;
  inverted?: boolean;
  // only used with primary for now
  lighterPrimary?: boolean;
  danger?: boolean;
  lighterDanger?: boolean;
  disabled?: boolean;
  outline?: boolean;
  fullWidth?: boolean;
  outlineGrey?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  small?: boolean;
  isLoading?: boolean;
  event?: string;
  eventProperties?: Record<string, unknown>;
  mr?: number;
  mx?: number;
  innerRef?: React.ForwardedRef<HTMLButtonElement>;
  style?: React.CSSProperties;
} & React.ComponentProps<typeof Base>;
class ButtonInner extends PureComponent<
  Props,
  {
    isFocused: boolean;
  }
> {
  static defaultProps = {
    onClick: noop,
    primary: false,
    small: false,
    danger: false,
    inverted: false,
  };

  state = {
    isFocused: false,
  };

  handleFocus = () => {
    if (isGlobalTabEnabled()) {
      this.setState({
        isFocused: true,
      });
    }
  };

  handleBlur = () => {
    this.setState({
      isFocused: false,
    });
  };

  render() {
    const { isFocused } = this.state;
    const { disabled, innerRef } = this.props;
    const { onClick, children, isLoading, event, eventProperties, ...rest } = this.props;
    const isClickDisabled = disabled || isLoading;
    const onClickHandler = (e: React.MouseEvent) => {
      if (onClick) {
        if (event) {
          track(event, eventProperties);
        }
        onClick(e);
      }
    };
    return (
      <Base
        {...rest}
        ref={innerRef}
        onClick={isClickDisabled ? undefined : onClickHandler}
        isFocused={isFocused}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        {isLoading ? (
          <LoadingWrapper>
            <Spinner size={16} />
          </LoadingWrapper>
        ) : null}
        <ChildrenWrapper isLoading={isLoading}>{children}</ChildrenWrapper>
      </Base>
    );
  }
}
const Button = React.forwardRef<HTMLButtonElement, Props>((props, ref) => (
  <ButtonInner {...props} innerRef={ref} />
));
export default Button;
