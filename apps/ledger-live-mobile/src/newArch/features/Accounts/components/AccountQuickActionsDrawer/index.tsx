import React from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Box, Flex } from "@ledgerhq/native-ui";
import { Account, TokenAccount } from "@ledgerhq/types-live";

import useAccountQuickActionDrawerViewModel from "./useAccountQuickActionDrawerViewModel";
import TransferButton from "~/components/TransferButton";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import CustomHeader from "./CustomHeader";
import { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import useAnalytics from "LLM/hooks/useAnalytics";
import { AnalyticContexts } from "LLM/hooks/useAnalytics/enums";

type AccountListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  account: Account | TokenAccount | null;
  currency: CryptoOrTokenCurrency;
};

const AccountQuickActionsDrawer = ({
  isOpen,
  onClose,
  account,
  currency,
}: AccountListDrawerProps) => {
  const { actions } = useAccountQuickActionDrawerViewModel({
    accounts: account ? [account as Account] : [],
    currency,
  });
  const { colors, space } = useTheme();
  const { analyticsMetadata } = useAnalytics(AnalyticContexts.AddAccounts);
  const pageTrackingEvent = analyticsMetadata.AddFunds?.onQuickActionOpen;

  return (
    <>
      {isOpen && (
        <TrackScreen name={pageTrackingEvent?.eventName} {...pageTrackingEvent?.payload} />
      )}
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        onClose={onClose}
        CustomHeader={() => (
          <CustomHeader
            account={account}
            onClose={onClose}
            backgroundColor={colors.neutral.c30}
            iconColor={colors.neutral.c100}
          />
        )}
      >
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
