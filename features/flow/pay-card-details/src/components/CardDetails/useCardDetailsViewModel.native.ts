import { useState } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { useCardAssetsViewModel, type CardAssetRow } from "@features/flow-pay-card-assets";
import { transactionClickedProperties } from "@features/flow-pay-card-transactions";
import type { CardTransactionItem } from "@features/flow-pay-card-transactions";
import { getWalletPlatform } from "@features/flow-pay-card-widget/native";
import { trackButtonClicked, trackTransactionClicked } from "@features/platform-pay-analytics";
import { useTranslation } from "@shared/i18n";
import { useFreezeCardViewModel } from "../Freeze/useFreezeCardViewModel";
import { useMoreViewModel } from "../More/useMoreViewModel";
import { useCardDetailsNavigation } from "./Scenes/navigation";
import type { CardDetailsSceneProps } from "./Scenes/types";
import type { CardDetailsProps, CardDetailsViewProps, CardFaceAction } from "../../types";

function cardFaceActions({
  choosingCardType,
  onChooseCardType,
  onTopUp,
  onDetailsPress,
  chooseCardTypeLabel,
  topUpLabel,
  detailsLabel,
}: {
  choosingCardType: boolean;
  onChooseCardType?: () => void;
  onTopUp?: () => void;
  onDetailsPress: () => void;
  chooseCardTypeLabel: string;
  topUpLabel: string;
  detailsLabel: string;
}): readonly CardFaceAction[] {
  if (choosingCardType && onChooseCardType) {
    return [
      {
        key: "choose-card-type",
        label: chooseCardTypeLabel,
        appearance: "base",
        onPress: onChooseCardType,
      },
    ];
  }

  const actions: CardFaceAction[] = [];

  if (onTopUp) {
    actions.push({ key: "top-up", label: topUpLabel, appearance: "base", onPress: onTopUp });
  }

  actions.push({
    key: "details",
    label: detailsLabel,
    appearance: "gray",
    onPress: onDetailsPress,
    testID: "card-details-button",
  });

  return actions;
}

export function useCardDetailsViewModel({
  cardVisual,
  assets,
  formatters,
  onShowMore,
  onTopUp,
  onChooseCardType,
  onViewRewards,
  cardSettingsActions,
  cardState = "ready",
}: CardDetailsProps): CardDetailsViewProps {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const choosingCardType = cardState === "choosingCardType" && onChooseCardType !== undefined;
  const { route, goTo, goBack } = useCardDetailsNavigation();
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

  const onAssetTransactionPress = (transaction: CardTransactionItem) => {
    goTo({ name: "assetTransaction", transaction });
  };

  const onAssetHistoryPress = () => {
    assetsViewModel.onShowHistoryPress();
    goBack();
  };

  const onAssetWithdrawContinue = () => {
    assetsViewModel.onWithdrawContinue();
    goBack();
  };

  const onAssetTopUpPress = () => {
    closeSheet();
    assetsViewModel.onTopUpPress();
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

    if (route.name === "assetTransaction") {
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
    onTopUpPress: onAssetTopUpPress,
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
      route.name === "assetDetails"
        ? {
            viewModel: assetSceneViewModel,
            onTransactionPress: onAssetTransactionPress,
          }
        : null,
    assetWithdraw: route.name === "assetWithdraw" ? assetSceneViewModel : null,
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
    faceActions: cardFaceActions({
      choosingCardType,
      onChooseCardType,
      onTopUp,
      onDetailsPress: openSheet,
      chooseCardTypeLabel: t("payTab.card.chooseCardType"),
      topUpLabel: t("payTab.card.topUp"),
      detailsLabel: t("payTab.card.details"),
    }),
    isSheetOpen: isSheetOpen && !choosingCardType,
    scene,
    onTopUp,
    onFacePress: choosingCardType ? undefined : openSheet,
    onSheetClose: closeSheet,
    onSceneBack,
  };
}
