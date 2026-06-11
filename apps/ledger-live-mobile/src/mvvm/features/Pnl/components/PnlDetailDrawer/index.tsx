import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
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
  footer,
  testID,
  pageName,
  source,
}: Readonly<PnlDetailDrawerProps>) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      testID={testID}
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={onClose}
    >
      {isOpen && pageName ? <TrackScreen name={pageName} source={source} /> : null}
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
        {footer ? (
          <Text typography="body4" lx={{ color: "muted", marginTop: "s20" }}>
            {footer}
          </Text>
        ) : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
