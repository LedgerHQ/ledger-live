import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  IconButton,
  NavBar,
  NavBarTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeAreaView from "~/components/SafeAreaView";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Lottie, resolveLottieSource, type LottieSource } from "LLM/components/Lottie";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import FirmwareUpdateAvailableDrawer from "LLM/components/FirmwareUpdateAvailableDrawer";
import GenuineCheckErrorDrawer from "LLM/components/GenuineCheckErrorDrawer";
import GenuineCheckNonGenuineDrawer from "LLM/components/GenuineCheckNonGenuineDrawer";
import UnsupportedUpdateDrawer from "LLM/components/UnsupportedUpdateDrawer";
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
      <SafeAreaView edges={["top"]} isFlex>
        <Box lx={{ flex: 1, gap: "s24" }}>
          <NavBar density="compact">
            {onQuit ? (
              <NavBarTrailing>
                <IconButton
                  appearance="no-background"
                  size="md"
                  icon={Close}
                  accessibilityLabel={closeLabel}
                  testID={checksTestIds.quit}
                  onPress={onQuit}
                />
              </NavBarTrailing>
            ) : null}
          </NavBar>
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
            </Box>
          ) : null}
        </Box>
      </SafeAreaView>
      {allowSheet ? (
        <QueuedBottomSheet
          isRequestingToBeOpened
          noCloseButton={!allowSheet.onClose}
          onHeaderClosePressed={allowSheet.onClose}
          preventBackdropClick
          enablePanDownToClose={false}
          testID={checksTestIds.allowSheet}
          enableDynamicSizing
          contentHasBottomSpace
        >
          <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
            <BottomSheetHeader />
            <Box lx={{ paddingHorizontal: "s16" }}>
              <DeviceActionContent
                action="continue"
                deviceModelId={allowSheet.deviceModelId}
                deviceName={allowSheet.deviceName}
                title={allowSheet.title}
              />
            </Box>
          </BottomSheetView>
        </QueuedBottomSheet>
      ) : null}
      {firmwareUpdate.isOpen ? <FirmwareUpdateAvailableDrawer {...firmwareUpdate} /> : null}
      {unsupportedUpdate.isOpen ? <UnsupportedUpdateDrawer {...unsupportedUpdate} /> : null}
      <GenuineCheckErrorDrawer
        isOpen={errorDrawer.isOpen}
        error={null}
        showProviderSettings={errorDrawer.kind === "provider"}
        productName={errorDrawer.productName}
        onRetry={errorDrawer.onRetry}
        onCancel={errorDrawer.onCancel}
        onClose={errorDrawer.onClose}
      />
      <GenuineCheckNonGenuineDrawer
        isOpen={notGenuineDrawer.isOpen}
        productName={notGenuineDrawer.productName}
        onClose={notGenuineDrawer.onClose}
      />
    </Box>
  );
}
