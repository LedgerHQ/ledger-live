import React from "react";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DeviceIntentTrackingProvider,
  useDeviceIntentTracking,
} from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";

type ErrorBottomSheetProps = {
  isOpen: boolean;
  /** Called on every close, also when `isOpen` becomes false. */
  onClose: () => void;
  /** Called only when the user presses the close button of the header, before `onClose`. */
  onHeaderClosePressed?: () => void;
  children: React.ReactNode;
  testID: string;
};

export function ErrorBottomSheet({
  isOpen,
  onClose,
  onHeaderClosePressed,
  children,
  testID,
}: Readonly<ErrorBottomSheetProps>): React.JSX.Element {
  const trackingContext = useDeviceIntentTracking();
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onHeaderClosePressed={onHeaderClosePressed}
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
        {/* The sheet renders its content through a portal, outside the provider of the caller. */}
        <DeviceIntentTrackingProvider value={trackingContext}>
          {children}
        </DeviceIntentTrackingProvider>
      </BottomSheetScrollView>
    </QueuedBottomSheet>
  );
}
