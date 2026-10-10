import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

export type OsUpdateStateSheetProps = Readonly<{
  isOpen: boolean;
  onClose?: () => void;
  hideHeader?: boolean;
  children: React.ReactNode;
}>;

export function OsUpdateStateSheet({
  isOpen,
  onClose,
  hideHeader = false,
  children,
}: OsUpdateStateSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
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
      maxDynamicContentSize={maxDynamicContentSize}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {hideHeader ? null : <BottomSheetHeader density="expanded" />}
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
