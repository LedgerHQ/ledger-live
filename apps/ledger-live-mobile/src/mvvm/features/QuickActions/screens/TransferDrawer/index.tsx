import React from "react";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { AccountAssetPickerSheet } from "LLM/components/AccountAssetPickerSheet";
import { TransferDrawerView } from "./TransferDrawerView";
import { useTransferDrawerViewModel } from "./useTransferDrawerViewModel";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";

/**
 * TransferDrawer - Bottom sheet with transfer action options
 *
 * Displays:
 * - Receive crypto: Opens the receive flow
 * - Send crypto: Navigates to send flow
 * - Bank transfer: Navigates to buy flow for stablecoin purchases
 */
export const TransferDrawer = () => {
  const { isOpen, title, actions, handleClose, bottomInset, assetPicker } =
    useTransferDrawerViewModel();
  return (
    <>
      <QueuedBottomSheet isForcingToBeOpened={isOpen} enableDynamicSizing onClose={handleClose}>
        <TransferDrawerView actions={actions} title={title} bottomInset={bottomInset} />
      </QueuedBottomSheet>
      <AccountAssetPickerSheet
        {...assetPicker}
        testID={QUICK_ACTIONS_TEST_IDS.transferDrawer.assetPicker}
      />
    </>
  );
};
