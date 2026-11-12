import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
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
  onAction,
  onClose,
  counterfeitWarning,
}: UnseededIntroKaraokeViewProps) {
  return (
    <Karaoke.Root phrases={phrases} tapLabel={tapLabel} testID={unseededIntroKaraokeTestIds.screen}>
      <Karaoke.Sequence
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
      />
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={unseededIntroKaraokeTestIds.close}
        onPress={onClose}
      />
      {counterfeitWarning ? <CounterfeitWarningDrawer {...counterfeitWarning} /> : null}
    </Karaoke.Root>
  );
}
