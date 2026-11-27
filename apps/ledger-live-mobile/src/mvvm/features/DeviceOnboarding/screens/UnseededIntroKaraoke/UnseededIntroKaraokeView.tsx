import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import CounterfeitWarningDrawer from "LLM/features/Onboarding/components/CounterfeitWarningDrawer";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { Karaoke } from "@shared/ui-karaoke/native";
import { unseededIntroKaraokeTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { UnseededIntroKaraokeViewProps } from "./useUnseededIntroKaraokeViewModel";

export function UnseededIntroKaraokeView({
  phrases,
  tapLabel,
  actionLabel,
  closeLabel,
  screenTracking,
  onAdvance,
  onAction,
  onClose,
  counterfeitWarning,
}: UnseededIntroKaraokeViewProps) {
  return (
    <Karaoke.Root
      phrases={phrases}
      tapLabel={tapLabel}
      onAdvance={onAdvance}
      testID={unseededIntroKaraokeTestIds.screen}
      action={
        <Button
          appearance="base"
          size="lg"
          isFull
          testID={unseededIntroKaraokeTestIds.action}
          onPress={onAction}
        >
          {actionLabel}
        </Button>
      }
    >
      {screenTracking ? <TrackScreen {...screenTracking} /> : null}
      <Karaoke.Sequence />
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={unseededIntroKaraokeTestIds.close}
        onPress={onClose}
      />
      {counterfeitWarning ? <CounterfeitWarningDrawer {...counterfeitWarning} /> : null}
    </Karaoke.Root>
  );
}
