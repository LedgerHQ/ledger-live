import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";

const CONTENT_BOTTOM_SPACING = 16;

export type OsUpdateStateSheetProps = Readonly<{
  isOpen: boolean;
  onClose?: () => void;
  hideHeader?: boolean;
  children: React.ReactNode;
}>;

function SheetContent({
  hideHeader,
  children,
}: Readonly<{ hideHeader: boolean; children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      {hideHeader ? null : <BottomSheetHeader density="expanded" />}
      <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
    </BottomSheetScrollView>
  );
}

export function OsUpdateStateSheet({
  isOpen,
  onClose,
  hideHeader = false,
  children,
}: OsUpdateStateSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;
  const isDismissable = onClose !== undefined;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={onClose}
      onBackdropPress={onClose}
      noCloseButton={hideHeader || !isDismissable}
      preventBackdropClick={!isDismissable}
      enablePanDownToClose={false}
      hideHandle
      enableDynamicSizing
      contentHasBottomSpace
      maxDynamicContentSize={maxDynamicContentSize}
    >
      <SheetContent hideHeader={hideHeader}>{children}</SheetContent>
    </QueuedBottomSheet>
  );
}
