import React from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { BalanceItem } from "../components/AccountBalances/AccountBalances.types";

const CONTENT_BOTTOM_SPACING = 24;

type Props = Readonly<{
  item: BalanceItem | undefined;
  onClose: () => void;
  testID?: string;
}>;

const SheetContent = ({ item }: Readonly<{ item: BalanceItem }>) => {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      <BottomSheetHeader density="expanded" title={item.label} />
      <Box lx={{ paddingBottom: "s16" }}>
        <Text typography="body2" lx={{ color: "muted" }}>
          {item.description}
        </Text>
      </Box>
    </BottomSheetScrollView>
  );
};

export const BalanceInfoSheet = ({ item, onClose, testID }: Props) => (
  <QueuedBottomSheet
    isRequestingToBeOpened={item !== undefined}
    onClose={onClose}
    enableDynamicSizing
    contentHasBottomSpace
    testID={testID}
  >
    {item ? <SheetContent item={item} /> : null}
  </QueuedBottomSheet>
);
