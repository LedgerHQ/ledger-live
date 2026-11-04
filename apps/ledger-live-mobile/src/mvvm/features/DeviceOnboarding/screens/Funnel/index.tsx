import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { QuitConfirmation } from "LLM/features/DeviceOnboarding/components/QuitConfirmation";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import { KaraokeScreen } from "LLM/features/DeviceOnboarding/screens/Karaoke";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

export function DeviceOnboardingFunnel() {
  const screen = useDeviceOnboardingFunnelViewModel();

  return (
    <>
      {screen.status === "karaoke" ? (
        <KaraokeScreen onClose={screen.onClose} />
      ) : screen.status === "checks" ? (
        <ChecksScreen {...screen.checks} />
      ) : (
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
      )}
      {screen.quitConfirmation ? <QuitConfirmation {...screen.quitConfirmation} /> : null}
    </>
  );
}
