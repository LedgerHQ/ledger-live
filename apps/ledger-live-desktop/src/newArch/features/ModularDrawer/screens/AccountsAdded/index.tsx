import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import { setDrawer } from "~/renderer/drawers/Provider";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { SuccessIcon, ActionButtons, AccountList, Title } from "./components";
import { useAccountFormatter } from "./hooks";
import { AccountsAddedProps } from "./types";

export const AccountsAdded = ({ accounts }: Readonly<AccountsAddedProps>) => {
  const formatAccount = useAccountFormatter();

  const handleAddFunds = useCallback(() => {
    // TODO: Implement redirection to next step
  }, []);

  const handleClose = () => setDrawer();

  return (
    <Flex flexDirection="column" height="100%">
      <TrackPage category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY} name="AccountsAdded" />
      <Flex flexDirection="column" width="100%" alignItems="center" flexShrink={0}>
        <SuccessIcon />
        <Title accountsCount={accounts.length} />
      </Flex>
      <Flex flex={1} minHeight={0}>
        <AccountList accounts={accounts} formatAccount={formatAccount} />
      </Flex>

      <ActionButtons onAddFunds={handleAddFunds} onClose={handleClose} />
    </Flex>
  );
};

export default AccountsAdded;
