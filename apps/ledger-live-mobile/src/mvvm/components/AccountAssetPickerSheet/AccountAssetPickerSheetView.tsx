import React from "react";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import AssetListItem from "LLM/components/AssetListItem";
import { useTranslation } from "~/context/Locale";
import type { AccountAssetPickerSheetViewModel } from "./useAccountAssetPickerSheetViewModel";

const CONTENT_BOTTOM_SPACING = 24;

type Props = AccountAssetPickerSheetViewModel & Readonly<{ testID?: string }>;

export function AccountAssetPickerSheetView({ rows, onRowPress, testID }: Props) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      testID={testID ? `${testID}-list` : undefined}
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      <BottomSheetHeader spacing density="expanded" title={t("accountAssetPicker.title")} />
      {rows.map(({ asset, precomputed }) => (
        <AssetListItem
          key={asset.currency.id}
          asset={asset}
          precomputed={precomputed}
          onPress={onRowPress}
          lx={rowStyle}
          hideNetwork
        />
      ))}
    </BottomSheetScrollView>
  );
}

const rowStyle: LumenViewStyle = { marginHorizontal: "-s8" };
