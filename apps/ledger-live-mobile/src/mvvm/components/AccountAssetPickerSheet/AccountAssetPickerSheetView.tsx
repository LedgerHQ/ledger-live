import React, { useCallback } from "react";
import type { ListRenderItemInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetFlatList, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import AssetListItem from "LLM/components/AssetListItem";
import { useTranslation } from "~/context/Locale";
import type {
  AccountAssetPickerRow,
  AccountAssetPickerSheetViewModel,
} from "./useAccountAssetPickerSheetViewModel";

type Props = AccountAssetPickerSheetViewModel & Readonly<{ testID?: string }>;

export function AccountAssetPickerSheetView({ rows, onRowPress, testID }: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInsets } = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item: { asset, precomputed } }: ListRenderItemInfo<AccountAssetPickerRow>) => (
      <AssetListItem
        asset={asset}
        precomputed={precomputed}
        onPress={onRowPress}
        lx={LIST_ITEM_NEGATIVE_OFFSET}
        hideNetwork
      />
    ),
    [onRowPress],
  );

  return (
    <>
      <BottomSheetHeader spacing density="expanded" title={t("accountAssetPicker.title")} />
      <BottomSheetFlatList
        testID={testID ? `${testID}-list` : undefined}
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingBottom: bottomInsets }}
      />
    </>
  );
}

const keyExtractor = ({ asset }: AccountAssetPickerRow) => asset.currency.id;

const LIST_ITEM_NEGATIVE_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };
