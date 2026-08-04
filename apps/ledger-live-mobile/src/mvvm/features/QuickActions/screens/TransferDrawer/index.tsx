import React from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import { TransferDrawerView } from "./TransferDrawerView";
import { useTransferDrawerViewModel } from "./useTransferDrawerViewModel";

type Props = Readonly<{
  currency?: CryptoOrTokenCurrency;
  ledgerIds?: string[];
}>;

/**
 * TransferDrawer - Bottom sheet with transfer action options
 *
 * Displays:
 * - Receive crypto: Opens the receive flow
 * - Send crypto: Navigates to send flow
 * - Bank transfer: Navigates to buy flow for stablecoin purchases
 */
export const TransferDrawer = ({ currency, ledgerIds }: Props = {}) => {
  const { isOpen, title, actions, handleClose, bottomInset } = useTransferDrawerViewModel({
    currency,
    ledgerIds,
  });
  return (
    <QueuedBottomSheet isForcingToBeOpened={isOpen} enableDynamicSizing onClose={handleClose}>
      <TransferDrawerView actions={actions} title={title} bottomInset={bottomInset} />
    </QueuedBottomSheet>
  );
};
