import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { karaokeTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { KaraokeViewProps } from "./useKaraokeViewModel";

export function KaraokeView({ closeLabel, onClose }: KaraokeViewProps) {
  return (
    <Box testID={karaokeTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={karaokeTestIds.close}
        onPress={onClose}
      />
    </Box>
  );
}
