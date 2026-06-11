import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { TransferDrawerView } from "./TransferDrawerView";
import { TransferDrawerViewLegacy } from "./TransferDrawerViewLegacy";
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
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  if (isEnabled) {
    return (
      <QueuedDrawerBottomSheet
        isForcingToBeOpened={isOpen}
        enableDynamicSizing
        onClose={handleClose}
      >
        <TransferDrawerView actions={actions} title={title} bottomInset={bottomInset} />
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} enableDynamicSizing onClose={handleClose}>
      <TransferDrawerViewLegacy actions={actions} title={title} />
    </QueuedDrawerGorhom>
  );
};
