import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glow } from "@shared/ui-glow/native";
import { KARAOKE_ACTION_GLOW_SIZE, KaraokeGlow } from "@shared/ui-karaoke/native";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { ChecksDrawers } from "LLM/features/DeviceOnboarding/components/ChecksDrawers";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { SetupInfo } from "@features/flow-device-onboarding-setup-info";
import { SetupStepper } from "@features/flow-device-onboarding-setup-stage";
import { ReconnectSheet } from "@features/flow-device-onboarding-reconnect";
import { UpdateOfferSheets } from "@features/flow-device-onboarding-update-offer";
import type { SetupViewProps } from "./useSetupScreenViewModel";

export function SetupView({
  deviceModelId,
  deviceName,
  title,
  stepper,
  closeLabel,
  onAskLeave,
  startLabel,
  onStart,
  supportLabel,
  onContactSupport,
  unsupportedUpdate,
  errorDrawer,
  notGenuineDrawer,
  infoCard,
  suspendInfoSheet,
  reportsRecoveryKey,
  connection,
  updateOffer,
  productName,
  suspendSheets,
}: SetupViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { theme, colorScheme } = useTheme();

  return (
    <Box testID={setupTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <Glow
        testID={setupTestIds.glow}
        showTop={false}
        showBottom
        canvasColor={theme.colors.bg.canvas}
        params={KARAOKE_ACTION_GLOW_SIZE}
        fallback={
          <KaraokeGlow isAtBottom delayMs={0} isLight={colorScheme === "light"} hasAction />
        }
      />
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
        <SetupInfo
          card={infoCard}
          suspendSheets={suspendInfoSheet}
          reportsRecoveryKey={reportsRecoveryKey}
        />
        <SetupStepper {...stepper} />
      </Box>
      <ChecksDrawers
        testIds={setupTestIds}
        unsupportedUpdate={unsupportedUpdate}
        errorDrawer={errorDrawer}
        notGenuineDrawer={notGenuineDrawer}
      />
      <ReconnectSheet
        connection={connection}
        productName={productName}
        suspendSheets={suspendSheets}
      />
      <UpdateOfferSheets {...updateOffer} />
    </Box>
  );
}
