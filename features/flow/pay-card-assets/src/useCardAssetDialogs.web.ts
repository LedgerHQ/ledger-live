import { useState } from "react";
import type { CardAssetDialogState, CardAssetRow, CardAssetsViewModel } from "./types";

/** Desktop opens the asset flows as dialogs over the list; mobile routes them as sheet scenes. */
export function useCardAssetDialogs({
  rows,
  getRecentTransactions,
  onTopUp,
  onWithdraw,
  onShowHistory,
  onManageOpen,
  onManageClose,
}: CardAssetsViewModel) {
  const [dialogState, setDialogState] = useState<CardAssetDialogState>("closed");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const selectedAsset = rows.find(row => row.id === selectedAssetId) ?? null;

  const onDialogClose = () => {
    if (dialogState === "manage") onManageClose();
    setDialogState("closed");
    setSelectedAssetId(null);
  };

  const handOffSelected = (action?: (asset: CardAssetRow) => void) => () => {
    if (selectedAsset) action?.(selectedAsset);
    onDialogClose();
  };

  return {
    dialogState,
    selectedAsset,
    selectedAssetTransactions: selectedAsset ? getRecentTransactions(selectedAsset) : [],
    onAssetPress: (asset: CardAssetRow) => {
      setSelectedAssetId(asset.id);
      setDialogState("details");
    },
    onManagePress: () => {
      onManageOpen();
      setDialogState("manage");
    },
    onDialogClose,
    onTopUpPress: handOffSelected(onTopUp),
    onWithdrawPress: () => setDialogState("withdraw"),
    /** Withdraw is nested in details: dismissing it returns to details, it does not close both. */
    onWithdrawClose: () => setDialogState("details"),
    onShowHistoryPress: handOffSelected(onShowHistory),
    onWithdrawContinue: handOffSelected(onWithdraw),
  };
}
