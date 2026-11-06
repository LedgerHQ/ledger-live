import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import FirmwareUpdateAvailableDrawer from "LLM/components/FirmwareUpdateAvailableDrawer";
import GenuineCheckErrorDrawer from "LLM/components/GenuineCheckErrorDrawer";
import GenuineCheckNonGenuineDrawer from "LLM/components/GenuineCheckNonGenuineDrawer";
import UnsupportedUpdateDrawer from "LLM/components/UnsupportedUpdateDrawer";
import type { ChecksDrawerProps } from "./useChecksDrawers";

type ChecksDrawersProps = ChecksDrawerProps &
  Readonly<{
    allowSheetTestID: string;
  }>;

export function ChecksDrawers({
  allowSheet,
  allowSheetTestID,
  firmwareUpdate,
  unsupportedUpdate,
  errorDrawer,
  notGenuineDrawer,
}: ChecksDrawersProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <>
      {allowSheet ? (
        <QueuedBottomSheet
          isRequestingToBeOpened
          noCloseButton={!allowSheet.onClose}
          onHeaderClosePressed={allowSheet.onClose}
          preventBackdropClick
          enablePanDownToClose={false}
          testID={allowSheetTestID}
          enableDynamicSizing
          contentHasBottomSpace
        >
          <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
            <BottomSheetHeader />
            <Box lx={{ paddingHorizontal: "s16" }}>
              <DeviceActionContent
                action="continue"
                deviceModelId={allowSheet.deviceModelId}
                deviceName={allowSheet.deviceName}
                title={allowSheet.title}
              />
            </Box>
          </BottomSheetView>
        </QueuedBottomSheet>
      ) : null}
      <FirmwareUpdateAvailableDrawer {...firmwareUpdate} />
      {unsupportedUpdate.isOpen ? <UnsupportedUpdateDrawer {...unsupportedUpdate} /> : null}
      <GenuineCheckErrorDrawer
        isOpen={errorDrawer.isOpen}
        error={null}
        showProviderSettings={errorDrawer.kind === "provider"}
        productName={errorDrawer.productName}
        onRetry={errorDrawer.onRetry}
        onCancel={errorDrawer.onCancel}
        onClose={errorDrawer.onClose}
      />
      <GenuineCheckNonGenuineDrawer
        isOpen={notGenuineDrawer.isOpen}
        productName={notGenuineDrawer.productName}
        onClose={notGenuineDrawer.onClose}
      />
    </>
  );
}
