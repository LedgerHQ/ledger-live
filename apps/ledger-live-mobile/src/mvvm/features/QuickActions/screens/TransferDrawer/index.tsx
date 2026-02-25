import React from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { TransferDrawerView } from "./TransferDrawerView";
import { TransferDrawerViewLegacy } from "./TransferDrawerViewLegacy";
import { useTransferDrawerViewModel } from "./useTransferDrawerViewModel";

/**
 * TransferDrawer - Bottom sheet with transfer action options
 *
 * Displays:
 * - Receive crypto: Opens the receive flow
 * - Send crypto: Navigates to send flow
 * - Bank transfer: Navigates to buy flow for stablecoin purchases
 */
export const TransferDrawer = () => {
  const { isOpen, actions, handleClose, t } = useTransferDrawerViewModel();
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  if (isEnabled) {
    return (
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isOpen}
        enableDynamicSizing
        onClose={handleClose}
      >
        <TransferDrawerView
          actions={actions}
          title={t("portfolio.quickActionsCtas.transferDrawer.title")}
        />
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} enableDynamicSizing onClose={handleClose}>
      <TransferDrawerViewLegacy
        actions={actions}
        title={t("portfolio.quickActionsCtas.transferDrawer.title")}
      />
    </QueuedDrawerGorhom>
  );
};
