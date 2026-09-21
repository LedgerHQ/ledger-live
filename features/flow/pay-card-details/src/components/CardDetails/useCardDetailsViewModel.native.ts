import { useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { useCardAssetsViewModel, type CardAssetRow } from "@features/flow-pay-card-assets";
import { transactionClickedProperties } from "@features/flow-pay-card-transactions";
import { useTranslation } from "@shared/i18n";
import { useFreezeCardViewModel } from "../Freeze/useFreezeCardViewModel";
import { useMoreViewModel } from "../More/useMoreViewModel";
import { useCardDetailsNavigation } from "./Scenes/navigation";
import type { CardDetailsSceneProps } from "./Scenes/types";
import type { CardDetailsProps, CardDetailsViewProps } from "../../types";

export function useCardDetailsViewModel({
  cardVisual,
  assets,
  formatters,
  onTrackEvent,
  onShowMore,
  onTopUp,
  cardSettingsActions,
}: CardDetailsProps): CardDetailsViewProps {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { route, goTo, goBack } = useCardDetailsNavigation();
  const assetsViewModel = useCardAssetsViewModel(assets);
  const freezeViewModel = useFreezeCardViewModel(goBack);
  const moreViewModel = useMoreViewModel(cardSettingsActions);

  const onFreezePress = () => {
    freezeViewModel.onOpenConfirm();
    goTo({ name: "freeze" });
  };

  const onMorePress = () => {
    goTo({ name: "more" });
  };

  const onTransactionPress = (transaction: PayCardTransaction) => {
    onTrackEvent?.("transaction_clicked", transactionClickedProperties(transaction));
    goTo({ name: "transaction", transaction });
  };

  const onAssetPress = (asset: CardAssetRow) => {
    assetsViewModel.onAssetPress(asset);
    goTo({ name: "assetDetails" });
  };

  const onManageAssetsPress = () => {
    assetsViewModel.onManagePress();
    goTo({ name: "assetsManage" });
  };

  const onAssetWithdrawPress = () => {
    assetsViewModel.onWithdrawPress();
    goTo({ name: "assetWithdraw" });
  };

  const onAssetHistoryPress = () => {
    assetsViewModel.onShowHistoryPress();
    goBack();
  };

  const onAssetWithdrawContinue = () => {
    assetsViewModel.onWithdrawContinue();
    goBack();
  };

  const onAddToWalletPress = () => {
    goTo({ name: "addToWallet" });
  };

  const openSheet = () => {
    goBack();
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    freezeViewModel.onClose();
    moreViewModel?.onSheetClose();
    goBack();
    assetsViewModel.onDialogClose();
    setIsSheetOpen(false);
  };

  const onSceneBack = () => {
    if (route.name === "assetWithdraw") {
      goTo({ name: "assetDetails" });
      return;
    }

    if (route.name === "assetDetails" || route.name === "assetsManage") {
      assetsViewModel.onDialogClose();
    }

    goBack();
  };

  const assetSceneViewModel = {
    ...assetsViewModel,
    onAssetPress,
    onManagePress: onManageAssetsPress,
    onWithdrawPress: onAssetWithdrawPress,
    onShowHistoryPress: onAssetHistoryPress,
    onWithdrawContinue: onAssetWithdrawContinue,
  };

  // The sheet chrome owns the title slot between back and close, the way the desktop dialog
  // header carries the asset name and its ticker.
  const header =
    route.name === "assetDetails" && assetsViewModel.selectedAsset
      ? {
          title: assetsViewModel.selectedAsset.name,
          description: assetsViewModel.selectedAsset.ticker,
        }
      : {};

  const scene: CardDetailsSceneProps = {
    route,
    header,
    overview: {
      cardVisual,
      assetsViewModel: assets ? assetSceneViewModel : null,
      freezeViewModel,
      moreViewModel,
      onFreezePress,
      onMorePress,
      onTransactionPress,
      onAddToWalletPress,
      onShowMore,
      formatters,
    },
    freeze: { viewModel: freezeViewModel },
    more: moreViewModel ? { viewModel: moreViewModel } : null,
    addToWallet: { onDone: goBack },
    transaction:
      route.name === "transaction" ? { transaction: route.transaction, formatters } : null,
    assetDetails: route.name === "assetDetails" ? { viewModel: assetSceneViewModel } : null,
    assetWithdraw: route.name === "assetWithdraw" ? assetSceneViewModel : null,
    assetsManage: route.name === "assetsManage" ? { viewModel: assetSceneViewModel } : null,
  };

  return {
    cardVisual,
    detailsLabel: t("payTab.card.details"),
    isSheetOpen,
    scene,
    onTopUp,
    onDetailsPress: openSheet,
    onSheetClose: closeSheet,
    onSceneBack,
  };
}
