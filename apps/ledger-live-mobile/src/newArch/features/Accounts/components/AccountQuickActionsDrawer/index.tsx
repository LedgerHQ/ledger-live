import React from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Box, Flex } from "@ledgerhq/native-ui";
import { Account, TokenAccount } from "@ledgerhq/types-live";

import useAccountQuickActionDrawerViewModel from "./useAccountQuickActionDrawerViewModel";
import TransferButton from "~/components/TransferButton";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import AccountItem from "../AccountsListView/components/AccountItem";
import { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import useAnalytics from "LLM/hooks/useAnalytics";
import { AnalyticContexts } from "LLM/hooks/useAnalytics/enums";

type AccountListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  account: Account | TokenAccount;
  currency: CryptoOrTokenCurrency;
  sourceScreenName?: string;
};

const AccountQuickActionsDrawer = ({
  isOpen,
  onClose,
  account,
  currency,
  sourceScreenName,
}: AccountListDrawerProps) => {
  const { actions } = useAccountQuickActionDrawerViewModel({
    account,
    currency,
  });
  const { space } = useTheme();
  const { analyticsMetadata } = useAnalytics(AnalyticContexts.AddAccounts, sourceScreenName);
  const pageTrackingEvent = analyticsMetadata.AddFunds?.onQuickActionOpen;

  return (
    <>
      {isOpen && (
        <TrackScreen name={pageTrackingEvent?.eventName} {...pageTrackingEvent?.payload} />
      )}
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
        {account && (
          <Flex
            flexDirection="row"
            width="100%"
            p={16}
            borderBottom={5}
            borderBottomColor="opacityDefault.c10"
            borderBottomWidth={1}
            mb={space[8]}
          >
            <AccountItem account={account} balance={account.balance} hideBalanceInfo />
          </Flex>
        )}
        <Flex width="100%" rowGap={space[8]} pb={space[8]}>
          {actions.map(button => (
            <Box key={button?.title}>
              <TransferButton {...button} testID={button?.testID} />
            </Box>
          ))}
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default AccountQuickActionsDrawer;
