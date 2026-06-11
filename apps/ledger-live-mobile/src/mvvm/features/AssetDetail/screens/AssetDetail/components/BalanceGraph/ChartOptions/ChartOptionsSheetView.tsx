import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  isHidden: boolean;
  toggleTransactionsTitle: string;
  onToggleTransactions: () => void;
}>;

export function ChartOptionsSheetView({
  isOpen,
  onClose,
  isHidden,
  toggleTransactionsTitle,
  onToggleTransactions,
}: Props) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      testID={ASSET_DETAIL_TEST_IDS.chartOptionsSheet}
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <ListItem
          onPress={onToggleTransactions}
          testID={ASSET_DETAIL_TEST_IDS.chartOptionsToggleTransactionsRow}
        >
          <ListItemLeading>
            <Spot appearance="icon" icon={isHidden ? Eye : EyeCross} />
            <ListItemContent>
              <ListItemTitle>{toggleTransactionsTitle}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
