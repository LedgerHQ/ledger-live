import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

export function FunnelSheet({
  testID,
  onQuit,
  children,
}: Readonly<{ testID: string; onQuit?: () => void; children: React.ReactNode }>) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      noCloseButton={!onQuit}
      onHeaderClosePressed={onQuit}
      preventBackdropClick
      enablePanDownToClose={false}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
