import React from "react";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { TransferDrawerView } from "./TransferDrawerView";
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

  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} enableDynamicSizing onClose={handleClose}>
      <TransferDrawerView
        actions={actions}
        title={t("portfolio.quickActionsCtas.transferDrawer.title")}
      />
    </QueuedDrawerGorhom>
  );
};
