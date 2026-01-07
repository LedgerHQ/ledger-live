import { Flex } from "@ledgerhq/react-ui";
import { default as React, useCallback, useEffect } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "../../analytics/addAccount.types";
import { TrackAddAccountScreen } from "../../analytics/TrackAddAccountScreen";
import useAddAccountAnalytics from "../../analytics/useAddAccountAnalytics";
import { ScrollContainer } from "../../components/ScrollContainer";
import { AccountList, ActionButtons, SuccessIcon, Title } from "./components";
import { useAccountFormatter } from "./hooks";
import { AccountsAddedProps } from "./types";
import { useSelector } from "LLD/hooks/redux";
import { modularDrawerSourceSelector } from "~/renderer/reducers/modularDrawer";

const AccountsAdded = ({
  accounts,
  navigateToEditAccountName,
  navigateToFundAccount,
  navigateToSelectAccount,
  isAccountSelectionFlow,
}: Readonly<AccountsAddedProps>) => {
  const source = useSelector(modularDrawerSourceSelector);
  const formatAccount = useAccountFormatter();
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const handleAddFunds = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Fund my account",
      page: ADD_ACCOUNT_PAGE_NAME.ADD_ACCOUNTS_SUCCESS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });

    if (accounts.length === 1) {
      navigateToFundAccount(accounts[0]);
    } else {
      navigateToSelectAccount();
    }
  }, [accounts, navigateToSelectAccount, navigateToFundAccount, trackAddAccountEvent]);

  const handleClose = () => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Close",
      page: ADD_ACCOUNT_PAGE_NAME.ADD_ACCOUNTS_SUCCESS,
      flow: ADD_ACCOUNT_FLOW_NAME,
    });
    setDrawer();
  };

  useEffect(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ACCOUNT_ADDED, {
      currency: accounts[0].currency.name,
      amount: accounts.length,
    });
  }, [accounts, trackAddAccountEvent]);

  return (
    <>
      <TrackAddAccountScreen page={ADD_ACCOUNT_PAGE_NAME.ADD_ACCOUNTS_SUCCESS} source={source} />
      <Flex flexDirection="column" width="100%" alignItems="center" flexShrink={0}>
        <SuccessIcon />
        <Title accountsCount={accounts.length} />
      </Flex>
      <ScrollContainer>
        <AccountList
          accounts={accounts}
          formatAccount={formatAccount}
          navigateToEditAccountName={navigateToEditAccountName}
          isAccountSelectionFlow={isAccountSelectionFlow}
        />
      </ScrollContainer>
      <ActionButtons
        onAddFunds={handleAddFunds}
        onClose={handleClose}
        isAccountSelectionFlow={isAccountSelectionFlow}
      />
    </>
  );
};

export default AccountsAdded;
