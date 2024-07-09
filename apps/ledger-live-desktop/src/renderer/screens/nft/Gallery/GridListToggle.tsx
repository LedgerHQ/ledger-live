import React, { useCallback } from "react";
import styled from "styled-components";
import { Card } from "~/renderer/components/Box";
import { useDispatch, useSelector } from "react-redux";
import { collectiblesViewModeSelector } from "~/renderer/reducers/settings";
import { setCollectiblesViewMode } from "~/renderer/actions/settings";
import Button from "~/renderer/components/Button";
import GridIcon from "~/renderer/icons/Grid";
import ListIcon from "~/renderer/icons/List";
import { Layout } from "~/newArch/Collectibles/types/Layouts";
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
const GridListToggle = () => {
  const dispatch = useDispatch();
  const nftsViewMode = useSelector(collectiblesViewModeSelector);
  const setListMode = useCallback(() => dispatch(setCollectiblesViewMode(Layout.LIST)), [dispatch]);
  const setGridMode = useCallback(() => dispatch(setCollectiblesViewMode(Layout.GRID)), [dispatch]);
  return (
    <Card horizontal justifyContent="flex-end" p={3} mb={3}>
      <ToggleButton mr={1} active={nftsViewMode === "list"} onClick={setListMode}>
        <ListIcon />
      </ToggleButton>
      <ToggleButton active={nftsViewMode === "grid"} onClick={setGridMode}>
        <GridIcon />
      </ToggleButton>
    </Card>
  );
};
export default GridListToggle;
