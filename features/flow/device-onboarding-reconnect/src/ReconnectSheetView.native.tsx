import React, { type ComponentProps } from "react";
import { BottomSheetHeader, BottomSheetView, Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { reconnectSheetTestIds } from "./internals";
import type { ReconnectSheetViewProps } from "./useReconnectSheetViewModel";

function ReconnectingSpinner({
  size,
}: Readonly<{ size?: ComponentProps<typeof Spinner>["size"] }>) {
  return <Spinner size={size} />;
}

export function ReconnectSheetView({
  state,
  isOpen,
  title,
  description,
  retryLabel,
  helpLabel,
  onRetry,
  onGetHelp,
  onClose,
}: ReconnectSheetViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const reconnecting = state === "reconnecting";

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={onClose}
      preventBackdropClick
      enablePanDownToClose={false}
      enableDynamicSizing
      contentHasBottomSpace
      testID={reconnecting ? reconnectSheetTestIds.reconnecting : reconnectSheetTestIds.failed}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>
          {reconnecting ? (
            <InfoState
              preset="spot"
              spotProps={{ icon: ReconnectingSpinner, size: 72 }}
              size="hug"
              title={title}
              description={description}
            />
          ) : (
            <InfoState
              preset="error"
              size="hug"
              title={title}
              description={description}
              primaryCta={{
                label: retryLabel,
                onPress: onRetry,
                testID: reconnectSheetTestIds.retry,
              }}
              secondaryCta={{
                label: helpLabel,
                onPress: onGetHelp,
                testID: reconnectSheetTestIds.help,
              }}
            />
          )}
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
