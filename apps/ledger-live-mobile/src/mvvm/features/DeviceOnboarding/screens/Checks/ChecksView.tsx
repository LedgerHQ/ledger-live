import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Trans } from "~/context/Locale";
import { Lottie, resolveLottieSource, type LottieSource } from "LLM/components/Lottie";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import FirmwareUpdateAvailableDrawer from "LLM/components/FirmwareUpdateAvailableDrawer";
import GenuineCheckErrorDrawer from "LLM/components/GenuineCheckErrorDrawer";
import UnsupportedUpdateDrawer from "LLM/components/UnsupportedUpdateDrawer";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksIllustration, ChecksViewProps } from "./useChecksScreenViewModel";
import darkLoadingAnimation from "./animations/dark/loading.lottie";
import darkScanAnimation from "./animations/dark/security-check.lottie";
import darkSuccessAnimation from "./animations/dark/success.lottie";
import lightLoadingAnimation from "./animations/light/loading.lottie";
import lightScanAnimation from "./animations/light/security-check.lottie";
import lightSuccessAnimation from "./animations/light/success.lottie";

const legacyErrorKinds = new Set(["provider", "unknown"]);

type ChecksSheetProps = Readonly<{
  isOpen: boolean;
  onClose?: () => void;
  testID: string;
  children: React.ReactNode;
}>;

function ChecksSheet({ isOpen, onClose, testID, children }: ChecksSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      noCloseButton={!onClose}
      onHeaderClosePressed={onClose}
      preventBackdropClick
      enablePanDownToClose={false}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16" }}>{children}</Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}

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
  const showsLegacyError = legacyErrorKinds.has(errorDrawer.kind);

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
      {allowSheet ? (
        <ChecksSheet
          isOpen={allowSheet.isOpen}
          onClose={allowSheet.onClose}
          testID={checksTestIds.allowSheet}
        >
          <ContinueOnDevice
            deviceModelId={allowSheet.deviceModelId}
            deviceName={allowSheet.deviceName}
          />
        </ChecksSheet>
      ) : null}
      {errorDrawer.kind === "declined" ? (
        <ChecksSheet isOpen={errorDrawer.isOpen} testID={checksTestIds.declinedSheet}>
          <InfoState
            preset="info"
            size="hug"
            title={
              <Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />
            }
            primaryCta={{
              label: <Trans i18nKey="common.close" />,
              onPress: errorDrawer.onCancel,
            }}
            secondaryCta={{
              label: <Trans i18nKey="common.retry" />,
              onPress: errorDrawer.onRetry,
            }}
          />
        </ChecksSheet>
      ) : null}
      {errorDrawer.kind === "network" ? (
        <ChecksSheet isOpen={errorDrawer.isOpen} testID={checksTestIds.networkSheet}>
          <InfoState
            preset="error"
            size="hug"
            title={<Trans i18nKey="deviceOnboarding.checks.network.title" />}
            description={<Trans i18nKey="deviceOnboarding.checks.network.description" />}
            primaryCta={{
              label: (
                <Trans i18nKey="deviceIntentExecutor.initialization.cta.contactLedgerSupport" />
              ),
              onPress: errorDrawer.onContactSupport,
            }}
            secondaryCta={{
              label: <Trans i18nKey="common.close" />,
              onPress: errorDrawer.onCancel,
            }}
          />
        </ChecksSheet>
      ) : null}
      <FirmwareUpdateAvailableDrawer {...firmwareUpdate} />
      {unsupportedUpdate.mounted ? (
        <UnsupportedUpdateDrawer
          isOpen={unsupportedUpdate.isOpen}
          isUsbRequired={unsupportedUpdate.isUsbRequired}
          productName={unsupportedUpdate.productName}
          onClose={unsupportedUpdate.onClose}
        />
      ) : null}
      {showsLegacyError ? (
        <GenuineCheckErrorDrawer
          isOpen={errorDrawer.isOpen}
          error={null}
          showProviderSettings={errorDrawer.kind === "provider"}
          productName={errorDrawer.productName}
          onRetry={errorDrawer.onRetry}
          onCancel={errorDrawer.onCancel}
          onClose={errorDrawer.onClose}
        />
      ) : null}
      <ChecksSheet
        isOpen={notGenuineDrawer.isOpen}
        onClose={notGenuineDrawer.onClose}
        testID={checksTestIds.notGenuineSheet}
      >
        <InfoState
          preset="info"
          size="hug"
          title={
            <Trans
              i18nKey="earlySecurityCheck.genuineCheckNonGenuineDrawer.title"
              values={{ productName: notGenuineDrawer.productName }}
            />
          }
          description={
            <Trans
              i18nKey="earlySecurityCheck.genuineCheckNonGenuineDrawer.description"
              values={{ productName: notGenuineDrawer.productName }}
            />
          }
          primaryCta={{
            label: <Trans i18nKey="earlySecurityCheck.genuineCheckNonGenuineDrawer.supportCta" />,
            onPress: notGenuineDrawer.onContactSupport,
          }}
        />
      </ChecksSheet>
    </Box>
  );
}
