import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spinner,
  Stepper,
} from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { ChecksDrawers } from "LLM/features/DeviceOnboarding/components/ChecksDrawers";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { SetupGlow } from "./components/SetupGlow";
import type { SetupStageStatus, SetupViewProps } from "./useSetupScreenViewModel";

function StageStatus({ status }: Readonly<{ status: SetupStageStatus }>) {
  if (status === "loading") return <Spinner size={20} testID={setupTestIds.stageLoading} />;
  if (status === "success") {
    return <CheckmarkCircleFill size={20} color="success" testID={setupTestIds.stageSuccess} />;
  }
  return null;
}

export function SetupView({
  deviceModelId,
  deviceName,
  title,
  stageTitle,
  stageDescription,
  currentStep,
  totalSteps,
  status,
  closeLabel,
  onAskLeave,
  startLabel,
  onStart,
  supportLabel,
  onContactSupport,
  reopenLabel,
  onReopenFirmwareOffer,
  skipUpdateLabel,
  onSkipUpdate,
  allowSheet,
  firmwareUpdate,
  unsupportedUpdate,
  errorDrawer,
  notGenuineDrawer,
}: SetupViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <Box testID={setupTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <SetupGlow />
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={setupTestIds.close}
        onPress={onAskLeave}
      />
      <Box lx={{ flex: 1, justifyContent: "center", paddingHorizontal: "s16" }}>
        <DeviceActionContent
          action="continue"
          deviceModelId={deviceModelId}
          deviceName={deviceName}
          title={title}
        />
      </Box>
      <Box
        lx={{ gap: "s16", paddingHorizontal: "s16", paddingTop: "s16" }}
        style={{ paddingBottom: bottomInset + 24 }}
      >
        {reopenLabel && onReopenFirmwareOffer ? (
          <Box lx={{ gap: "s8" }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              testID={setupTestIds.reopenUpdate}
              onPress={onReopenFirmwareOffer}
            >
              {reopenLabel}
            </Button>
            {skipUpdateLabel && onSkipUpdate ? (
              <Button
                appearance="transparent"
                size="lg"
                isFull
                testID={setupTestIds.skipUpdate}
                onPress={onSkipUpdate}
              >
                {skipUpdateLabel}
              </Button>
            ) : null}
          </Box>
        ) : null}
        {startLabel && onStart ? (
          <Button appearance="base" size="lg" isFull testID={setupTestIds.start} onPress={onStart}>
            {startLabel}
          </Button>
        ) : null}
        {supportLabel && onContactSupport ? (
          <Button
            appearance="base"
            size="lg"
            isFull
            testID={setupTestIds.contactSupport}
            onPress={onContactSupport}
          >
            {supportLabel}
          </Button>
        ) : null}
        <Card type="info" testID={setupTestIds.stepper}>
          <CardHeader>
            <CardLeading>
              <Stepper currentStep={currentStep} totalSteps={totalSteps} />
              <CardContent>
                <CardContentTitle>{stageTitle}</CardContentTitle>
                {stageDescription ? (
                  <CardContentDescription>{stageDescription}</CardContentDescription>
                ) : null}
              </CardContent>
            </CardLeading>
            <CardTrailing>
              <StageStatus status={status} />
            </CardTrailing>
          </CardHeader>
        </Card>
      </Box>
      <ChecksDrawers
        allowSheet={allowSheet}
        testIds={setupTestIds}
        firmwareUpdate={firmwareUpdate}
        unsupportedUpdate={unsupportedUpdate}
        errorDrawer={errorDrawer}
        notGenuineDrawer={notGenuineDrawer}
      />
    </Box>
  );
}
