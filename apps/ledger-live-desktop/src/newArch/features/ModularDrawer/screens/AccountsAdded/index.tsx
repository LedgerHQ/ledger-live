import { Flex } from "@ledgerhq/react-ui";
import React, { useCallback } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { setDrawer } from "~/renderer/drawers/Provider";
import { ScrollContainer } from "../../components/ScrollContainer";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { AccountList, ActionButtons, SuccessIcon, Title } from "./components";
import { useAccountFormatter } from "./hooks";
import { AccountsAddedProps } from "./types";

export const AccountsAdded = ({
  accounts,
  onFundAccount,
  navigateToSelectAccount,
  isAccountSelectionFlow,
}: Readonly<AccountsAddedProps>) => {
  const formatAccount = useAccountFormatter();

  const handleAddFunds = useCallback(() => {
    if (accounts.length === 1) {
      onFundAccount(accounts[0]);
    } else {
      navigateToSelectAccount();
    }
  }, [accounts, navigateToSelectAccount, onFundAccount]);

  const handleClose = () => setDrawer();

  return (
    <Flex flexDirection="column" height="100%">
      <TrackPage category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY} name="AccountsAdded" />
      <Flex flexDirection="column" width="100%" alignItems="center" flexShrink={0}>
        <SuccessIcon />
        <Title accountsCount={accounts.length} />
      </Flex>
      <ScrollContainer>
        <AccountList accounts={accounts} formatAccount={formatAccount} />
      </ScrollContainer>

      <ActionButtons
        onAddFunds={handleAddFunds}
        onClose={handleClose}
        isAccountSelectionFlow={isAccountSelectionFlow}
      />
    </Flex>
  );
};

export default AccountsAdded;
