import React from "react";
import styled from "styled-components";
import { Card } from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import useLayout from "LLD/features/Collectibles/hooks/useLayout";
import { Layout, LayoutKey } from "LLD/features/Collectibles/types/Layouts";
import { Icons } from "@ledgerhq/react-ui";

const ToggleButton = styled(Button).attrs<{
  active?: boolean;
}>({})<{ active?: boolean }>`
  height: 30px;
  width: 30px;
  padding: 6px;
  background: ${p =>
    p.active ? p.theme.colors.pillActiveBackground : p.theme.colors.palette.background.paper};
  color: ${p => (p.active ? p.theme.colors.wallet : p.theme.colors.palette.divider)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TableLayoutToggleComponent: React.FC = () => {
  const { collectiblesViewMode, setViewMode } = useLayout();

  const isActive = (mode: LayoutKey) => collectiblesViewMode === mode;

  return (
    <Card horizontal justifyContent="flex-end" p={3}>
      <ToggleButton mr={1} active={isActive(Layout.LIST)} onClick={() => setViewMode(Layout.LIST)}>
        <Icons.MenuBurger size="S" />
      </ToggleButton>
      <ToggleButton active={isActive(Layout.GRID)} onClick={() => setViewMode(Layout.GRID)}>
        <Icons.Grid size="XS" />
      </ToggleButton>
    </Card>
  );
};

export const TableLayoutToggle = TableLayoutToggleComponent;
