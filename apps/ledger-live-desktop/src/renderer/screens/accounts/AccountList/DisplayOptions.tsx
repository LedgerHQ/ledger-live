import React from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { setAccountsViewMode } from "~/renderer/actions/settings";
import { accountsViewModeSelector } from "~/renderer/reducers/settings";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import GridIcon from "~/renderer/icons/Grid";
import ListIcon from "~/renderer/icons/List";
import AccountsOrder from "./Order";
import AccountsRange from "./Range";
function DisplayOptions() {
  const dispatch = useDispatch();
  const mode = useSelector(accountsViewModeSelector);
  return (
    <>
      <AccountsOrder />
      <Box ml={4} mr={4}>
        <AccountsRange />
      </Box>
      <ToggleButton
        event="Account view table"
        id="accounts-display-list"
        mr={1}
        onClick={() => dispatch(setAccountsViewMode("list"))}
        active={mode === "list"}
      >
        <ListIcon />
      </ToggleButton>
      <ToggleButton
        event="Account view mosaic"
        id="accounts-display-grid"
        onClick={() => dispatch(setAccountsViewMode("card"))}
        active={mode === "card"}
      >
        <GridIcon />
      </ToggleButton>
    </>
  );
}
export default React.memo<{}>(DisplayOptions);

const ToggleButton = styled(Button)<{ active?: boolean }>`
  height: 30px;
  width: 30px;
  padding: 7px;
  background: ${p =>
    p.active ? p.theme.colors.pillActiveBackground : p.theme.colors.palette.background.paper};
  color: ${p => (p.active ? p.theme.colors.wallet : p.theme.colors.palette.divider)};
`;
