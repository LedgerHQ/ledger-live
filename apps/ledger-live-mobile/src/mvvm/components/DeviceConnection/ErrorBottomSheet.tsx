import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ErrorBottomSheetProps = {
  isOpen: boolean;
  /** Called on every close, also when `isOpen` becomes false. */
  onClose: () => void;
  children: React.ReactNode;
  testID: string;
};

export function ErrorBottomSheet({
  isOpen,
  onClose,
  children,
  testID,
}: Readonly<ErrorBottomSheetProps>): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID={testID}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
