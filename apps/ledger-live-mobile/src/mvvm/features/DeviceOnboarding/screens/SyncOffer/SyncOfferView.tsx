import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { Lottie, resolveLottieSource } from "LLM/components/Lottie";
import SkipLedgerSyncDrawer from "LLM/components/SkipLedgerSyncDrawer";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { syncOfferTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { SyncOfferViewProps } from "./useSyncOfferScreenViewModel";
import darkCloudSyncAnimation from "./animations/dark/cloud-sync.lottie";
import lightCloudSyncAnimation from "./animations/light/cloud-sync.lottie";

const illustrationHeight = 200;
const illustrationSize = 96;
const cloudSyncSources = {
  light: resolveLottieSource(lightCloudSyncAnimation),
  dark: resolveLottieSource(darkCloudSyncAnimation),
};

export function SyncOfferView({
  title,
  description,
  learnMoreLabel,
  activateLabel,
  skipLabel,
  closeLabel,
  onActivate,
  onOpenSkip,
  onLearnMore,
  onQuit,
  skipDrawer,
}: SyncOfferViewProps) {
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? "dark" : "light";

  return (
    <Box testID={syncOfferTestIds.screen} lx={{ flex: 1, gap: "s24", backgroundColor: "canvas" }}>
      <DeviceOnboardingCloseBar
        label={closeLabel}
        testID={syncOfferTestIds.quit}
        onPress={onQuit}
      />
      <Box
        lx={{ alignItems: "center", justifyContent: "center", minHeight: "s72", flexShrink: 1 }}
        style={{ height: illustrationHeight }}
      >
        <Lottie
          key={theme}
          source={cloudSyncSources[theme]}
          loop
          style={{ width: illustrationSize, height: illustrationSize }}
        />
      </Box>
      <Box lx={{ flexGrow: 1, gap: "s8", paddingHorizontal: "s16", paddingBottom: "s16" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {description}
          {"\n\n"}
          <Text
            typography="body2"
            accessibilityRole="link"
            testID={syncOfferTestIds.learnMore}
            onPress={onLearnMore}
            style={{ textDecorationLine: "underline" }}
          >
            {learnMoreLabel}
          </Text>
        </Text>
      </Box>
      <Box lx={{ gap: "s16", paddingHorizontal: "s16", paddingBottom: "s24" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          testID={syncOfferTestIds.activate}
          onPress={onActivate}
        >
          {activateLabel}
        </Button>
        <Button
          appearance="transparent"
          size="lg"
          isFull
          testID={syncOfferTestIds.skip}
          onPress={onOpenSkip}
        >
          {skipLabel}
        </Button>
      </Box>
      <SkipLedgerSyncDrawer
        isOpen={skipDrawer.isOpen}
        handleClose={skipDrawer.onClose}
        openSync={skipDrawer.onActivate}
        skipSync={skipDrawer.onSkip}
      />
    </Box>
  );
}
