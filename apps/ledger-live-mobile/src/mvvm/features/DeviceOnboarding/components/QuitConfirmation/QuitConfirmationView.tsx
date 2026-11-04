import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
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
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onContinue}
      enableDynamicSizing
      testID={quitConfirmationTestIds.sheet}
    >
      <BottomSheetView style={{ flex: 0 }}>
        <BottomSheetHeader />
        <Box
          lx={{
            width: "full",
            gap: "s24",
            paddingHorizontal: "s16",
            paddingTop: "s8",
            alignItems: "center",
          }}
        >
          <Spot appearance="muted" icon={InformationFill} size={72} />
          <Box lx={{ width: "full", gap: "s12", alignItems: "center" }}>
            <Text
              typography="heading4SemiBold"
              lx={{ color: "base", textAlign: "center", width: "full" }}
            >
              {title}
            </Text>
            <Box lx={{ width: "full", alignItems: "center", gap: "s4" }}>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
                {description}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
                {restart}
              </Text>
            </Box>
          </Box>
          <Box lx={{ width: "full", gap: "s16" }}>
            <Button
              appearance="base"
              size="lg"
              lx={{ width: "full" }}
              testID={quitConfirmationTestIds.leave}
              onPress={onLeave}
            >
              {leaveLabel}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              lx={{ width: "full" }}
              testID={quitConfirmationTestIds.continue}
              onPress={onContinue}
            >
              {continueLabel}
            </Button>
          </Box>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
