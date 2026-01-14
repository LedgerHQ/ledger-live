import React, { PureComponent } from "react";
import styled, { DefaultTheme } from "styled-components";
import Hide from "~/renderer/components/MainSideBar/Hide";
import Box, { Tabbable } from "~/renderer/components/Box";
import Tooltip from "~/renderer/components/Tooltip";

interface IconProps {
  size: "S" | "XS" | "M" | "L" | "XL" | undefined;
}

export type Props = {
  label: string | ((a: Props) => React.ReactNode);
  desc?: (a: Props) => React.ReactNode;
  icon?: ({ size }: IconProps) => React.JSX.Element;
  iconSize?: IconProps["size"];
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
      iconSize = "S",
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
      <Tooltip arrow={false} content={renderedLabel} enabled={!!collapsed} placement="right">
        <Container
          data-testid={`drawer-${id}-button`}
          isActive={!disabled && isActive}
          data-active={isActive ? "true" : "false"}
          iconActiveColor={iconActiveColor}
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
        >
          {!!Icon && <Icon size={iconSize} />}
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
  borderRadius: 2,
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
  color: ${p => (p.isActive ? p.theme.colors.neutral.c100 : p.theme.colors.opacityDefault.c70)};
  background: ${p => (p.isActive ? p.theme.colors.opacityDefault.c05 : "")};
  opacity: ${p => (p.disabled ? 0.5 : 1)};

  &:active {
    background: ${p => !p.disabled && p.theme.colors.opacityDefault.c05};
  }

  &:hover {
    background: ${p => !p.disabled && p.theme.colors.opacityDefault.c05};
  }

  ${p => {
    const iconActiveColor =
      p.theme.colors[p.iconActiveColor as keyof DefaultTheme["colors"]] || p.iconActiveColor;
    const color = p.isActive ? iconActiveColor : p.theme.colors.opacityDefault.c70;
    return `
      svg { color: ${color}; }
    `;
  }};
`;
export default SideBarListItem;
