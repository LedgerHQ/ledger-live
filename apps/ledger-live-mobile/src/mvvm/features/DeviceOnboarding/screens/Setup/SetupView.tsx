import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { ChecksDrawers } from "LLM/features/DeviceOnboarding/components/ChecksDrawers";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { SetupViewProps } from "./useSetupScreenViewModel";

export function SetupView({
  title,
  description,
  progress,
  indicatorLabel,
  closeLabel,
  onAskLeave,
  startLabel,
  onStart,
  allowSheet,
  firmwareUpdate,
  unsupportedUpdate,
  errorDrawer,
  notGenuineDrawer,
  quitConfirmation,
}: SetupViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <Box testID={setupTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <Box lx={{ flex: 1, gap: "s24" }}>
        <DeviceOnboardingCloseBar
          label={closeLabel}
          testID={setupTestIds.close}
          onPress={onAskLeave}
        />
        <Box lx={{ flexGrow: 1, gap: "s8", paddingHorizontal: "s16", paddingBottom: "s16" }}>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {progress}
          </Text>
          <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {title}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
          {indicatorLabel ? (
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {indicatorLabel}
            </Text>
          ) : null}
        </Box>
        {startLabel && onStart ? (
          <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: bottomInset }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              testID={setupTestIds.start}
              onPress={onStart}
            >
              {startLabel}
            </Button>
          </Box>
        ) : null}
      </Box>
      <ChecksDrawers
        allowSheet={allowSheet}
        allowSheetTestID={setupTestIds.allowSheet}
        firmwareUpdate={firmwareUpdate}
        unsupportedUpdate={unsupportedUpdate}
        errorDrawer={errorDrawer}
        notGenuineDrawer={notGenuineDrawer}
      />
      {quitConfirmation.isOpen ? (
        <QueuedBottomSheet
          isRequestingToBeOpened
          onClose={quitConfirmation.onContinue}
          onHeaderClosePressed={quitConfirmation.onContinue}
          testID={setupTestIds.quit}
          enableDynamicSizing
          contentHasBottomSpace
        >
          <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
            <BottomSheetHeader />
            <Box lx={{ gap: "s16", paddingHorizontal: "s16" }}>
              <Text typography="heading4SemiBold" lx={{ color: "base" }}>
                {quitConfirmation.title}
              </Text>
              <Text typography="body2" lx={{ color: "muted" }}>
                {quitConfirmation.description}
              </Text>
              <Button
                appearance="base"
                size="lg"
                isFull
                testID={setupTestIds.quitContinue}
                onPress={quitConfirmation.onContinue}
              >
                {quitConfirmation.continueLabel}
              </Button>
              <Button
                appearance="transparent"
                size="lg"
                isFull
                testID={setupTestIds.quitLeave}
                onPress={quitConfirmation.onLeave}
              >
                {quitConfirmation.leaveLabel}
              </Button>
            </Box>
          </BottomSheetView>
        </QueuedBottomSheet>
      ) : null}
    </Box>
  );
}
