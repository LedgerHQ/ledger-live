import React, { useCallback, useEffect } from "react";
import { Flex } from "@ledgerhq/react-ui";
import { setDrawer } from "~/renderer/drawers/Provider";
import { SuccessIcon, ActionButtons, AccountList, Title } from "./components";
import { useAccountFormatter } from "./hooks";
import { AccountsAddedProps } from "./types";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../../analytics/addAccount.types";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import useAddAccountAnalytics from "../../analytics/useAddAccountAnalytics";

export const AccountsAdded = ({
  accounts,
  onFundAccount,
  navigateToSelectAccount,
  isAccountSelectionFlow,
  source,
}: Readonly<AccountsAddedProps>) => {
  const formatAccount = useAccountFormatter();
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const handleAddFunds = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Fund my account",
      page: ADD_ACCOUNT_PAGE_NAME.ADD_ACCOUNTS_SUCCESS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });

    if (accounts.length === 1) {
      onFundAccount(accounts[0]);
    } else {
      navigateToSelectAccount();
    }
  }, [accounts, navigateToSelectAccount, onFundAccount, trackAddAccountEvent]);

  const handleClose = () => setDrawer();

  useEffect(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ACCOUNT_ADDED, {
      currency: accounts[0].currency.name,
      amount: accounts.length,
    });
  }, [accounts, trackAddAccountEvent]);

  return (
    <Flex flexDirection="column" height="100%">
      <TrackAddAccountScreen page={ADD_ACCOUNT_PAGE_NAME.ADD_ACCOUNTS_SUCCESS} source={source} />
      <Flex flexDirection="column" width="100%" alignItems="center" flexShrink={0}>
        <SuccessIcon />
        <Title accountsCount={accounts.length} />
      </Flex>
      <Flex flex={1} minHeight={0}>
        <AccountList accounts={accounts} formatAccount={formatAccount} />
      </Flex>

      <ActionButtons
        onAddFunds={handleAddFunds}
        onClose={handleClose}
        isAccountSelectionFlow={isAccountSelectionFlow}
      />
    </Flex>
  );
};

export default AccountsAdded;
