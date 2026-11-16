import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lottie, resolveLottieSource, type LottieSource } from "LLM/components/Lottie";
import { ChecksDrawers } from "LLM/features/DeviceOnboarding/components/ChecksDrawers";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksIllustration, ChecksViewProps } from "./useChecksScreenViewModel";
import darkLoadingAnimation from "./animations/dark/loading.lottie";
import darkScanAnimation from "./animations/dark/security-check.lottie";
import darkSuccessAnimation from "./animations/dark/success.lottie";
import lightLoadingAnimation from "./animations/light/loading.lottie";
import lightScanAnimation from "./animations/light/security-check.lottie";
import lightSuccessAnimation from "./animations/light/success.lottie";

const illustrationHeight = 200;
const illustrationSize = 96;
const illustrationSources: Record<"light" | "dark", Record<ChecksIllustration, LottieSource>> = {
  light: {
    loading: resolveLottieSource(lightLoadingAnimation),
    scan: resolveLottieSource(lightScanAnimation),
    success: resolveLottieSource(lightSuccessAnimation),
  },
  dark: {
    loading: resolveLottieSource(darkLoadingAnimation),
    scan: resolveLottieSource(darkScanAnimation),
    success: resolveLottieSource(darkSuccessAnimation),
  },
};

function Illustration({ kind }: Readonly<{ kind: ChecksIllustration }>) {
  const { colorScheme } = useTheme();
  const theme = colorScheme === "dark" ? "dark" : "light";

  return (
    <Box
      lx={{
        alignItems: "center",
        justifyContent: "center",
        minHeight: "s72",
        flexShrink: 1,
      }}
      style={{ height: illustrationHeight }}
    >
      <Lottie
        key={`${theme}-${kind}`}
        source={illustrationSources[theme][kind]}
        loop={kind !== "success"}
        style={{ width: illustrationSize, height: illustrationSize }}
      />
    </Box>
  );
}

export function ChecksView({
  illustration,
  title,
  description,
  primaryLabel,
  primaryTestID,
  primaryLoading,
  onPrimary,
  secondary,
  onQuit,
  closeLabel,
  allowSheet,
  firmwareUpdate,
  unsupportedUpdate,
  errorDrawer,
  notGenuineDrawer,
}: ChecksViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <Box testID={checksTestIds.screen} lx={{ flex: 1, backgroundColor: "canvas" }}>
      <Box lx={{ flex: 1, gap: "s24" }}>
        <DeviceOnboardingCloseBar label={closeLabel} testID={checksTestIds.quit} onPress={onQuit} />
        {illustration ? <Illustration kind={illustration} /> : null}
        <Box lx={{ flexGrow: 1, gap: "s8", paddingHorizontal: "s16", paddingBottom: "s16" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {title}
          </Text>
          {description ? (
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {description}
            </Text>
          ) : null}
        </Box>
        {primaryLabel ? (
          <Box lx={{ paddingHorizontal: "s16" }} style={{ paddingBottom: bottomInset }}>
            <Box lx={{ gap: "s16" }}>
              {primaryLoading ? (
                <Button appearance="transparent" size="lg" isFull loading>
                  {primaryLabel}
                </Button>
              ) : (
                <Button
                  appearance="base"
                  size="lg"
                  isFull
                  testID={primaryTestID}
                  onPress={onPrimary}
                >
                  {primaryLabel}
                </Button>
              )}
              {secondary ? (
                <Button
                  appearance="transparent"
                  size="lg"
                  isFull
                  testID={secondary.testID}
                  onPress={secondary.onPress}
                >
                  {secondary.label}
                </Button>
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Box>
      <ChecksDrawers
        testIds={checksTestIds}
        allowSheet={allowSheet}
        firmwareUpdate={firmwareUpdate}
        unsupportedUpdate={unsupportedUpdate}
        errorDrawer={errorDrawer}
        notGenuineDrawer={notGenuineDrawer}
      />
    </Box>
  );
}
