import React from "react";
import { Box, Button, IconButton, NavBar, NavBarTrailing, Text } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Lottie, resolveLottieSource } from "LLM/components/Lottie";
import { offerTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { OfferViewProps } from "./useOfferScreenViewModel";
import cloudSyncAnimation from "./animations/cloud-sync.lottie";

const illustrationHeight = 200;
const illustrationSize = 96;
const cloudSyncSource = resolveLottieSource(cloudSyncAnimation);

export function OfferView({
  title,
  description,
  learnMoreLabel,
  activateLabel,
  skipLabel,
  closeLabel,
  onActivate,
  onSkip,
  onLearnMore,
  onQuit,
}: OfferViewProps) {
  return (
    <Box testID={offerTestIds.screen} lx={{ flex: 1, gap: "s24", backgroundColor: "canvas" }}>
      <NavBar density="compact">
        <NavBarTrailing>
          <IconButton
            appearance="no-background"
            size="md"
            icon={Close}
            accessibilityLabel={closeLabel}
            testID={offerTestIds.quit}
            onPress={onQuit}
          />
        </NavBarTrailing>
      </NavBar>
      <Box
        lx={{ alignItems: "center", justifyContent: "center", minHeight: "s72", flexShrink: 1 }}
        style={{ height: illustrationHeight }}
      >
        <Lottie
          source={cloudSyncSource}
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
            testID={offerTestIds.learnMore}
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
          testID={offerTestIds.activate}
          onPress={onActivate}
        >
          {activateLabel}
        </Button>
        <Button
          appearance="transparent"
          size="lg"
          isFull
          testID={offerTestIds.skip}
          onPress={onSkip}
        >
          {skipLabel}
        </Button>
      </Box>
    </Box>
  );
}
