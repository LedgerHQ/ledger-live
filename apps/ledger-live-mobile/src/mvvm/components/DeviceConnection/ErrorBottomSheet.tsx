import React from "react";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Platform, useWindowDimensions } from "react-native";
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
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      maxDynamicContentSize={maxDynamicContentSize}
      contentHasBottomSpace
      testID={testID}
    >
      <BottomSheetScrollView
        style={{ paddingBottom: 0 }}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BottomSheetHeader />
        {children}
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
