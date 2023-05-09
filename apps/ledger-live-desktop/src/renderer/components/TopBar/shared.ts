import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import { Tabbable } from "~/renderer/components/Box";

type ItemProps = {
  "data-e2e"?: string;
  isInteractive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  justifyContent?: string;
};

export const ItemContainer = styled(Tabbable).attrs<ItemProps>(p => ({
  px: 3,
  ml: 0,
  alignItems: "center",
  cursor: p.disabled ? "not-allowed" : "default",
  horizontal: true,
  borderRadius: 1,
}))<ItemProps>`
  -webkit-app-region: no-drag;
  height: 40px;
  position: relative;
  pointer-events: ${p => (p.disabled ? "none" : "unset")};

  &:hover {
    color: ${p => (p.disabled ? "" : p.theme.colors.palette.text.shade100)};
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.action.active, 0.05))};
  }

  &:active {
    background: ${p => (p.disabled ? "" : rgba(p.theme.colors.palette.action.active, 0.1))};
  }
`;
export const Bar = styled.div`
  margin-left: 5px;
  margin-right: 5px;
  height: 15px;
  width: 1px;
  background: ${p => p.theme.colors.palette.divider};
`;
