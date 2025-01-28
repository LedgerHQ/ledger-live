import React from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import { Box, Flex } from "@ledgerhq/native-ui";
import { Account, TokenAccount } from "@ledgerhq/types-live";

import useAccountQuickActionDrawerViewModel from "./useAccountQuickActionDrawerViewModel";
import TransferButton from "~/components/TransferButton";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import CustomHeader from "./CustomHeader";
import { useTheme } from "styled-components/native";

type AccountListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  account: Account | TokenAccount | null;
  currency: CryptoOrTokenCurrency;
};

const AccountQuickActionsDrawer = ({
  isOpen,
  onClose,
  onBack,
  account,
  currency,
}: AccountListDrawerProps) => {
  const { actions } = useAccountQuickActionDrawerViewModel({
    accounts: account ? [account as Account] : [],
    currency,
  });
  const { colors } = useTheme();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onBack={onBack}
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
  );
};

export default AccountQuickActionsDrawer;
