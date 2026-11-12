import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { quitConfirmationTestIds } from "LLM/features/DeviceOnboarding/testIds";

export type QuitConfirmationViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  restart: string;
  leaveLabel: string;
  continueLabel: string;
  onLeave: () => void;
  onContinue: () => void;
}>;

export function QuitConfirmationView({
  isOpen,
  title,
  description,
  restart,
  leaveLabel,
  continueLabel,
  onLeave,
  onContinue,
}: QuitConfirmationViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onContinue}
      enableDynamicSizing
      contentHasBottomSpace
      testID={quitConfirmationTestIds.sheet}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>
          <InfoState
            preset="info"
            size="hug"
            title={title}
            description={`${description}\n${restart}`}
            primaryCta={{
              label: leaveLabel,
              onPress: onLeave,
              testID: quitConfirmationTestIds.leave,
            }}
            secondaryCta={{
              label: continueLabel,
              onPress: onContinue,
              testID: quitConfirmationTestIds.continue,
            }}
          />
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
