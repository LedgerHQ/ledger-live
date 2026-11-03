import React, { useCallback } from "react";
import type { ListRenderItemInfo } from "react-native";
import {
  BottomSheetFlatList,
  BottomSheetHeader,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "@shared/i18n";
import type { AccountAssetPickerProps, AccountAssetPickerRow } from "../AccountAssetPicker.types";

const ICON_SIZE = 48;
const CONTENT_BOTTOM_SPACING = 24;

const keyExtractor = (row: AccountAssetPickerRow) => row.id;

function AccountAssetPickerListItem({
  row,
  onSelect,
  testID,
}: Readonly<{
  row: AccountAssetPickerRow;
  onSelect: (id: string) => void;
  testID?: string;
}>) {
  return (
    <ListItem onPress={() => onSelect(row.id)} testID={testID} lx={{ marginHorizontal: "-s8" }}>
      <ListItemLeading>
        <CryptoIcon ledgerId={row.ledgerId} ticker={row.ticker} size={ICON_SIZE} />
        <ListItemContent>
          <ListItemTitle>{row.name}</ListItemTitle>
          <ListItemDescription>{row.ticker}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent lx={{ alignItems: "flex-end" }}>
          <ListItemTitle>{row.countervalue ?? row.cryptoAmount}</ListItemTitle>
          {row.countervalue ? <ListItemDescription>{row.cryptoAmount}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}

export function AccountAssetPickerContent({
  rows,
  onSelect,
  testID,
}: Omit<AccountAssetPickerProps, "open" | "onClose">) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountAssetPickerRow>) => (
      <AccountAssetPickerListItem
        row={item}
        onSelect={onSelect}
        testID={testID ? `${testID}-${item.id}` : undefined}
      />
    ),
    [onSelect, testID],
  );

  return (
    <>
      <BottomSheetHeader
        spacing
        density="expanded"
        title={t("accountDetailHero.assetPicker.title")}
      />
      <BottomSheetFlatList
        testID={testID ? `${testID}-list` : undefined}
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      />
    </>
  );
}
