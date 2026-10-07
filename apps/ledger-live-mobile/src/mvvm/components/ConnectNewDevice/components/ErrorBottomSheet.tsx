import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ErrorBottomSheetProps = {
  isOpen: boolean;
  /** Called on every close, also when `isOpen` becomes false. */
  onClose: () => void;
  children: React.ReactNode;
};

export function ErrorBottomSheet({
  isOpen,
  onClose,
  children,
}: Readonly<ErrorBottomSheetProps>): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="connect-new-device-error-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
