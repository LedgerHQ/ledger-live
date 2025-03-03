import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Account, AccountLike } from "@ledgerhq/types-live";
import TrackPage, { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { Redirect } from "react-router";
import { useFlattenSortAccounts } from "~/renderer/actions/general";
import { accountsSelector, starredAccountsSelector } from "~/renderer/reducers/accounts";
import { accountsViewModeSelector, selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import AccountList from "./AccountList";
import AccountsHeader from "./AccountsHeader";

export default function AccountsPage() {
  const mode = useSelector(accountsViewModeSelector);
  const range = useSelector(selectedTimeRangeSelector);
  const rawAccounts = useSelector(accountsSelector);
  const starredAccounts = useSelector(starredAccountsSelector);
  const flattenedAccounts = useFlattenSortAccounts({
    enforceHideEmptySubAccounts: true,
  });
  const accounts = useMemo(
    () => (mode === "card" ? flattenedAccounts : rawAccounts),
    [mode, flattenedAccounts, rawAccounts],
  );
  const history = useHistory();

  const onAccountClick = useCallback(
    (account: AccountLike, parentAccount?: Account | null) => {
      setTrackingSource("accounts page");
      history.push({
        pathname: parentAccount
          ? `/account/${parentAccount.id}/${account.id}`
          : `/account/${account.id}`,
      });
    },
    [history],
  );
  if (!accounts.length) {
    return <Redirect to="/" />;
  }
  return (
    <Box>
      <TrackPage
        category="Accounts"
        accountsLength={accounts.length}
        starredAccountsLength={starredAccounts.length}
        mode={mode}
      />
      <AccountsHeader />
      <AccountList onAccountClick={onAccountClick} accounts={accounts} range={range} mode={mode} />
    </Box>
  );
}
export const GenericBox = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  flex: 1;
  padding: 10px 20px;
  margin-bottom: 9px;
  color: #abadb6;
  font-weight: 600;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: row;
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 #00000007;
`;
