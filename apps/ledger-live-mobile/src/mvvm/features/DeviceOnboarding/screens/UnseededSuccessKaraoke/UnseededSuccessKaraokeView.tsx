import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { Karaoke } from "@shared/ui-karaoke/native";
import { unseededSuccessKaraokeTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { UnseededSuccessKaraokeViewProps } from "./useUnseededSuccessKaraokeViewModel";

export function UnseededSuccessKaraokeView({
  phrases,
  tapLabel,
  actionLabel,
  onAction,
}: UnseededSuccessKaraokeViewProps) {
  return (
    <Karaoke.Root
      phrases={phrases}
      tapLabel={tapLabel}
      testID={unseededSuccessKaraokeTestIds.screen}
      action={
        <Button
          appearance="base"
          size="lg"
          isFull
          testID={unseededSuccessKaraokeTestIds.action}
          onPress={onAction}
        >
          {actionLabel}
        </Button>
      }
    >
      <Karaoke.Sequence />
    </Karaoke.Root>
  );
}
