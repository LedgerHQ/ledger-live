import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { PnlDetailDrawerProps } from "./types";
import { usePnlDetailDrawerViewModel } from "./usePnlDetailDrawerViewModel";
import { PnlDetailRow } from "./PnlDetailRow";

export function PnlDetailDrawer(props: Readonly<PnlDetailDrawerProps>) {
  const { isOpen, onClose, title, description, bodyText, items, testID } =
    usePnlDetailDrawerViewModel(props);
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      testID={testID}
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader density="expanded" title={title} description={description} />
        {bodyText ? (
          <Text typography="body1" lx={{ color: "base", marginBottom: "s16" }}>
            {bodyText}
          </Text>
        ) : null}
        <Box lx={{ gap: "s16" }}>
          {items.map(item => (
            <PnlDetailRow key={item.title} item={item} />
          ))}
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
