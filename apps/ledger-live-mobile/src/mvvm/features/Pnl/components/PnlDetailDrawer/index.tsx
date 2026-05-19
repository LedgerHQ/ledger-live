import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { PnlDetailDrawerProps } from "./types";
import { PnlDetailRow } from "./PnlDetailRow";

export function PnlDetailDrawer({
  isOpen,
  onClose,
  title,
  description,
  bodyText,
  items = [],
  testID,
}: Readonly<PnlDetailDrawerProps>) {
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
