import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { UnlockDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/UnlockDevice";
import { QuitConfirmation } from "LLM/features/DeviceOnboarding/components/QuitConfirmation";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import { SetupScreen } from "LLM/features/DeviceOnboarding/screens/Setup";
import { UnseededIntroKaraokeScreen } from "LLM/features/DeviceOnboarding/screens/UnseededIntroKaraoke";
import { funnelTestIds } from "LLM/features/DeviceOnboarding/testIds";
import {
  useDeviceOnboardingFunnelViewModel,
  type DeviceOnboardingFunnelModel,
  type UnlockSheetModel,
} from "./useDeviceOnboardingFunnelViewModel";

function FunnelBody({ screen }: Readonly<{ screen: DeviceOnboardingFunnelModel }>) {
  if (screen.status === "unseededIntroKaraoke") {
    return (
      <>
        <UnseededIntroKaraokeScreen {...screen.unseededIntroKaraoke} />
        {screen.unlockSheet ? <DeviceUnlockSheet {...screen.unlockSheet} /> : null}
      </>
    );
  }
  if (screen.status === "checks") {
    return (
      <>
        <ChecksScreen {...screen.checks} />
        {screen.unlockSheet ? <DeviceUnlockSheet {...screen.unlockSheet} /> : null}
      </>
    );
  }
  if (screen.status === "setup") {
    return (
      <>
        <SetupScreen {...screen.setup} />
        {screen.unlockSheet ? <DeviceUnlockSheet {...screen.unlockSheet} /> : null}
      </>
    );
  }

  return (
    <Box lx={{ flex: 1, justifyContent: "center", gap: "s16", padding: "s16" }}>
      <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {screen.title}
      </Text>
      {screen.status === "failed" ? (
        <Button appearance="base" size="lg" isFull onPress={screen.onRetry}>
          {screen.retryLabel}
        </Button>
      ) : null}
      <Button appearance="transparent" size="lg" isFull onPress={screen.onQuit}>
        {screen.closeLabel}
      </Button>
    </Box>
  );
}

export function DeviceOnboardingFunnel() {
  const screen = useDeviceOnboardingFunnelViewModel();

  return (
    <>
      <FunnelBody screen={screen} />
      {screen.quitConfirmation ? <QuitConfirmation {...screen.quitConfirmation} /> : null}
    </>
  );
}

function DeviceUnlockSheet({ deviceModelId, deviceName }: UnlockSheetModel) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      noCloseButton
      preventBackdropClick
      enablePanDownToClose={false}
      enableDynamicSizing
      contentHasBottomSpace
      testID={funnelTestIds.unlockSheet}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>
          <UnlockDevice deviceModelId={deviceModelId} deviceName={deviceName} />
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
