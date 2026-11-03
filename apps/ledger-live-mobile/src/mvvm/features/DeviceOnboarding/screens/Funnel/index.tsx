import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { QuitConfirmation } from "LLM/features/DeviceOnboarding/components/QuitConfirmation";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import { KaraokeScreen } from "LLM/features/DeviceOnboarding/screens/Karaoke";
import { SetupScreen } from "LLM/features/DeviceOnboarding/screens/Setup";
import {
  useDeviceOnboardingFunnelViewModel,
  type DeviceOnboardingFunnelModel,
} from "./useDeviceOnboardingFunnelViewModel";

function FunnelBody({ screen }: Readonly<{ screen: DeviceOnboardingFunnelModel }>) {
  if (screen.status === "karaoke") {
    return <KaraokeScreen onClose={screen.onClose} />;
  }
  if (screen.status === "checks") {
    return <ChecksScreen {...screen.checks} />;
  }
  if (screen.status === "setup") {
    return <SetupScreen {...screen.setup} />;
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
