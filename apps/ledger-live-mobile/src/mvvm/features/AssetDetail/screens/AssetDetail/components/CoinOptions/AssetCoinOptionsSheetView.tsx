import React from "react";
import { useTranslation } from "~/context/Locale";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross, Star, StarFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { CoinOptionRow } from "./CoinOptionRow";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  isHidden: boolean;
  isStarred: boolean;
  onToggleFavourite: () => void;
  onToggleHideFromPortfolio: () => void;
}>;

export function AssetCoinOptionsSheetView({
  isOpen,
  onClose,
  isHidden,
  isStarred,
  onToggleFavourite,
  onToggleHideFromPortfolio,
}: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const favouriteTitle = isStarred
    ? t("assetDetail.coinOptions.removeFavourite")
    : t("assetDetail.coinOptions.addFavourite");
  const hideTitle = isHidden
    ? t("assetDetail.coinOptions.showInPortfolio")
    : t("assetDetail.coinOptions.hideFromPortfolio");

  return (
    <QueuedDrawerBottomSheet
      testID={ASSET_DETAIL_TEST_IDS.coinOptionsSheet}
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <CoinOptionRow
          onPress={onToggleFavourite}
          title={favouriteTitle}
          Icon={isStarred ? StarFill : Star}
          testID={ASSET_DETAIL_TEST_IDS.coinOptionsFavouriteRow}
        />
        <CoinOptionRow
          onPress={onToggleHideFromPortfolio}
          title={hideTitle}
          Icon={isHidden ? Eye : EyeCross}
          testID={ASSET_DETAIL_TEST_IDS.coinOptionsHideRow}
        />
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
