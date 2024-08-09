import React from "react";
import styled from "styled-components";
import { Card } from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import GridIcon from "~/renderer/icons/Grid";
import ListIcon from "~/renderer/icons/List";
import useLayout from "LLD/features/Collectibles/hooks/useLayout";
import { Layout, LayoutKey } from "LLD/features/Collectibles/types/Layouts";

const ToggleButton = styled(Button).attrs<{
  active?: boolean;
}>({})<{ active?: boolean }>`
  height: 30px;
  width: 30px;
  padding: 7px;
  background: ${p =>
    p.active ? p.theme.colors.pillActiveBackground : p.theme.colors.palette.background.paper};
  color: ${p => (p.active ? p.theme.colors.wallet : p.theme.colors.palette.divider)};
`;

const TableLayoutToggleComponent: React.FC = () => {
  const { collectiblesViewMode, setViewMode } = useLayout();

  const isActive = (mode: LayoutKey) => collectiblesViewMode === mode;

  return (
    <Card horizontal justifyContent="flex-end" p={3} mb={3}>
      <ToggleButton mr={1} active={isActive(Layout.LIST)} onClick={() => setViewMode(Layout.LIST)}>
        <ListIcon />
      </ToggleButton>
      <ToggleButton active={isActive(Layout.GRID)} onClick={() => setViewMode(Layout.GRID)}>
        <GridIcon />
      </ToggleButton>
    </Card>
  );
};

export const TableLayoutToggle = TableLayoutToggleComponent;
