import { useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { useCardAssetsViewModel, type CardAssetRow } from "@features/flow-pay-card-assets";
import { transactionClickedProperties } from "@features/flow-pay-card-transactions";
import { getWalletPlatform } from "@features/flow-pay-card-widget/native";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
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
  onShowMore,
  onTopUp,
  onViewRewards,
  cardSettingsActions,
}: CardDetailsProps): CardDetailsViewProps {
  const { t } = useTranslation();
  const { trackButtonClicked, trackTransactionClicked } = usePayAnalyticsContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { route, goTo, goBack, reset } = useCardDetailsNavigation();
  const assetsViewModel = useCardAssetsViewModel(assets);
  const freezeViewModel = useFreezeCardViewModel(goBack);
  const moreViewModel = useMoreViewModel(cardSettingsActions);

  const onFreezePress = () => {
    freezeViewModel.onOpenConfirm();
    goTo({ name: "freeze" });
  };

  const onMorePress = () => {
    trackButtonClicked({ button: "more", page: "Card details" });
    goTo({ name: "more" });
  };

  const onTransactionPress = (transaction: PayCardTransaction) => {
    trackTransactionClicked(transactionClickedProperties(transaction));
    goTo({ name: "transaction", transaction });
  };

  const onAssetPress = (asset: CardAssetRow) => {
    goTo({ name: "assetDetails", asset });
  };

  const onManageAssetsPress = () => {
    assetsViewModel.onManageOpen();
    goTo({ name: "assetsManage" });
  };

  const onAssetTopUp = (asset: CardAssetRow) => {
    assetsViewModel.onTopUp?.(asset);
    reset();
  };

  const onAssetWithdrawContinue = (asset: CardAssetRow) => {
    assetsViewModel.onWithdraw?.(asset);
    reset();
  };

  const onAddToWalletPress = () => {
    trackButtonClicked({
      button: `add to ${getWalletPlatform().brand.toLowerCase()} pay`,
      page: "Card details",
    });
    goTo({ name: "addToWallet" });
  };

  const openSheet = () => {
    trackButtonClicked({ button: "card_details", page: "Pay" });
    reset();
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    freezeViewModel.onClose();
    moreViewModel?.onSheetClose();
    if (route.name === "assetsManage") assetsViewModel.onManageClose();
    reset();
    setIsSheetOpen(false);
  };

  const onSceneBack = () => {
    if (route.name === "assetsManage") assetsViewModel.onManageClose();
    goBack();
  };

  const assetSceneViewModel = {
    ...assetsViewModel,
    onAssetPress,
    onManagePress: onManageAssetsPress,
  };

  // Routes keep the asset as pressed; prefer the live row so balances stay current.
  const routeAsset =
    route.name === "assetDetails" || route.name === "assetWithdraw"
      ? (assetsViewModel.rows.find(row => row.id === route.asset.id) ?? route.asset)
      : null;

  // The sheet chrome owns the title slot between back and close, the way the desktop dialog
  // header carries the asset name and its ticker.
  const header =
    route.name === "assetDetails" && routeAsset
      ? { title: routeAsset.name, description: routeAsset.ticker }
      : {};

  const scene: CardDetailsSceneProps = {
    route,
    header,
    overview: {
      cardVisual,
      assetsViewModel: assets ? assetSceneViewModel : null,
      assets,
      freezeViewModel,
      moreViewModel,
      onFreezePress,
      onMorePress,
      onTransactionPress,
      onAddToWalletPress,
      onShowMore,
      onViewRewards,
      formatters,
      disclaimer: t("payTab.disclaimer"),
    },
    freeze: { viewModel: freezeViewModel },
    more: moreViewModel ? { viewModel: moreViewModel } : null,
    addToWallet: { onDone: goBack },
    transaction:
      route.name === "transaction" ? { transaction: route.transaction, formatters } : null,
    assetDetails:
      route.name === "assetDetails" && routeAsset
        ? {
            asset: routeAsset,
            transactions: assetsViewModel.getRecentTransactions(routeAsset),
            copy: assetsViewModel.dialogCopy,
            formatBalance: assetsViewModel.formatBalance,
            formatters: assetsViewModel.formatters,
            onTopUp: () => onAssetTopUp(routeAsset),
            onWithdraw: () => goTo({ name: "assetWithdraw", asset: routeAsset }),
            onShowHistory: () => assetsViewModel.onShowHistory?.(routeAsset),
            onTransactionPress: transaction => goTo({ name: "assetTransaction", transaction }),
          }
        : null,
    assetWithdraw:
      route.name === "assetWithdraw" && routeAsset
        ? {
            copy: assetsViewModel.dialogCopy,
            onContinue: () => onAssetWithdrawContinue(routeAsset),
          }
        : null,
    assetsManage: route.name === "assetsManage" ? { viewModel: assetSceneViewModel } : null,
    assetTransaction:
      route.name === "assetTransaction"
        ? {
            transaction: route.transaction,
            formatters: assetsViewModel.formatters,
          }
        : null,
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
