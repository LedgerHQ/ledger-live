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
  const { colors } = useTheme();
  const { analyticsMetadata } = useAnalytics("addAccounts");
  const pageTrackingEvent = analyticsMetadata.AddFunds?.onQuickActionOpen;

  return (
    <>
      {isOpen && (
        <TrackScreen name={pageTrackingEvent?.eventName} {...pageTrackingEvent?.payload} />
      )}
      <QueuedDrawer
        isRequestingToBeOpened={isOpen}
        CustomHeader={() => (
          <CustomHeader
            account={account}
            onClose={onClose}
            backgroundColor={colors.opacityDefault.c10}
            iconColor={colors.neutral.c100}
          />
        )}
      >
        <Flex width="100%" rowGap={6}>
          {actions.map((button, index) => (
            <Box mb={index === actions.length - 1 ? 0 : 8} key={button?.title as string}>
              <TransferButton {...button} testID={button?.testID as string} />
            </Box>
          ))}
        </Flex>
      </QueuedDrawer>
    </>
  );
};

export default AccountQuickActionsDrawer;
