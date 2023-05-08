import React, { PureComponent } from "react";
import styled, { DefaultTheme } from "styled-components";
import Hide from "~/renderer/components/MainSideBar/Hide";
import Box, { Tabbable } from "~/renderer/components/Box";
import Tooltip from "~/renderer/components/Tooltip";

export type Props = {
  label: string | ((a: Props) => React.ReactNode);
  desc?: (a: Props) => React.ReactNode;
  icon?: React.ComponentType<{ size?: number }>;
  iconSize?: number;
  disabled?: boolean;
  iconActiveColor: string | undefined;
  NotifComponent?: React.ReactNode;
  onClick?: (arg: React.SyntheticEvent) => void;
  isActive?: boolean;
  collapsed?: boolean;
  id: string;
};

class SideBarListItem extends PureComponent<Props> {
  render() {
    const {
      icon: Icon,
      iconSize,
      label,
      desc,
      iconActiveColor,
      NotifComponent,
      onClick,
      isActive,
      disabled,
      collapsed,
      id,
    } = this.props;
    const renderedLabel =
      typeof label === "function" ? (
        label(this.props)
      ) : (
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      );
    return (
      <Tooltip content={renderedLabel} enabled={!!collapsed} placement="right">
        <Container
          data-test-id={`drawer-${id}-button`}
          isActive={!disabled && isActive}
          iconActiveColor={iconActiveColor}
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
        >
          {!!Icon && <Icon size={iconSize || 16} />}
          <Box grow shrink>
            <Hide visible={!collapsed}>
              <Box horizontal justifyContent="space-between" alignItems="center">
                {renderedLabel}
                {!!desc && desc(this.props)}
              </Box>
            </Hide>
          </Box>
          {NotifComponent}
        </Container>
      </Tooltip>
    );
  }
}
const Container = styled(Tabbable).attrs(() => ({
  alignItems: "center",
  borderRadius: 1,
  ff: "Inter|SemiBold",
  flow: 3,
  horizontal: true,
  px: 3,
  py: 2,
}))<{
  isActive?: boolean;
  iconActiveColor?: string;
}>`
  position: relative;
  width: 100%;
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  color: ${p =>
    p.isActive ? p.theme.colors.palette.text.shade100 : p.theme.colors.palette.text.shade80};
  background: ${p => (p.isActive ? p.theme.colors.palette.action.hover : "")};
  opacity: ${p => (p.disabled ? 0.5 : 1)};

  &:active {
    background: ${p => !p.disabled && p.theme.colors.palette.action.hover};
  }

  &:hover {
    color: ${p => !p.disabled && p.theme.colors.palette.text.shade100};
  }

  ${p => {
    const iconActiveColor =
      p.theme.colors[p.iconActiveColor as keyof DefaultTheme["colors"]] || p.iconActiveColor;
    const color = p.isActive ? iconActiveColor : p.theme.colors.palette.text.shade60;
    return `
      svg { color: ${color}; }
      &:hover svg { color: ${p.disabled ? color : iconActiveColor}; }
    `;
  }};
`;
export default SideBarListItem;
