import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState, type InfoStateCta } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Trans } from "~/context/Locale";
import { Lottie, resolveLottieSource, type LottieSource } from "LLM/components/Lottie";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import FirmwareUpdateAvailableDrawer from "LLM/components/FirmwareUpdateAvailableDrawer";
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

type ChecksSheetProps = Readonly<{
  isOpen: boolean;
  onHeaderClosePressed?: () => void;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  testID: string;
  children: React.ReactNode;
}>;

type ChecksInfoSheetProps = Readonly<{
  isOpen: boolean;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  testID: string;
  trackName?: string;
  trackCategory?: string;
  preset: "info" | "error";
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryCta: InfoStateCta;
  secondaryCta?: InfoStateCta;
}>;

function ChecksInfoSheet({
  isOpen,
  onDismiss,
  showCloseButton,
  testID,
  trackName,
  trackCategory,
  preset,
  title,
  description,
  primaryCta,
  secondaryCta,
}: ChecksInfoSheetProps) {
  return (
    <ChecksSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      showCloseButton={showCloseButton}
      testID={testID}
    >
      {isOpen ? (
        <TrackScreen
          name={trackName}
          category={trackCategory}
          type="drawer"
          refreshSource={false}
        />
      ) : null}
      <InfoState
        preset={preset}
        size="hug"
        title={title}
        description={description}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
      />
    </ChecksSheet>
  );
}

function ChecksSheet({
  isOpen,
  onHeaderClosePressed,
  onDismiss,
  showCloseButton,
  testID,
  children,
}: ChecksSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      noCloseButton={!onHeaderClosePressed && !showCloseButton}
      onHeaderClosePressed={onHeaderClosePressed}
      onClose={onDismiss}
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
          onHeaderClosePressed={allowSheet.onClose}
          testID={checksTestIds.allowSheet}
        >
          <ContinueOnDevice
            deviceModelId={allowSheet.deviceModelId}
            deviceName={allowSheet.deviceName}
          />
        </ChecksSheet>
      ) : null}
      {errorDrawer.kind === "declined" ? (
        <ChecksInfoSheet
          isOpen={errorDrawer.isOpen}
          onDismiss={errorDrawer.onClose}
          testID={checksTestIds.declinedSheet}
          trackName="Error: unknown error"
          preset="info"
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
      ) : null}
      {errorDrawer.kind === "network" ? (
        <ChecksInfoSheet
          isOpen={errorDrawer.isOpen}
          onDismiss={errorDrawer.onClose}
          testID={checksTestIds.networkSheet}
          trackName="Error: unknown error"
          preset="error"
          title={<Trans i18nKey="deviceOnboarding.checks.network.title" />}
          description={<Trans i18nKey="deviceOnboarding.checks.network.description" />}
          primaryCta={{
            label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.contactLedgerSupport" />,
            onPress: errorDrawer.onContactSupport,
          }}
          secondaryCta={{
            label: <Trans i18nKey="common.close" />,
            onPress: errorDrawer.onCancel,
          }}
        />
      ) : null}
      {errorDrawer.kind === "unknown" ? (
        <ChecksInfoSheet
          isOpen={errorDrawer.isOpen}
          onDismiss={errorDrawer.onClose}
          testID={checksTestIds.unknownSheet}
          trackName="Error: unknown error"
          preset="error"
          title={<Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.title" />}
          description={
            <Trans
              i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.description"
              values={{ productName: errorDrawer.productName }}
            />
          }
          primaryCta={{
            label: <Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.retryCta" />,
            onPress: errorDrawer.onRetry,
          }}
          secondaryCta={{
            label: <Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.cancelCta" />,
            onPress: errorDrawer.onCancel,
          }}
        />
      ) : null}
      {errorDrawer.kind === "provider" ? (
        <ChecksInfoSheet
          isOpen={errorDrawer.isOpen}
          onDismiss={errorDrawer.onClose}
          testID={checksTestIds.providerSheet}
          trackName="Error: Device OS version not recognized"
          preset="error"
          title={
            <Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.title" />
          }
          description={
            <Trans
              i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.description"
              values={{ productName: errorDrawer.productName }}
            />
          }
          primaryCta={{
            label: (
              <Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.settingsCta" />
            ),
            onPress: errorDrawer.onGoToSettings,
          }}
          secondaryCta={{
            label: <Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.cancelCta" />,
            onPress: errorDrawer.onCancel,
          }}
        />
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
      <ChecksInfoSheet
        isOpen={notGenuineDrawer.isOpen}
        onDismiss={notGenuineDrawer.onClose}
        showCloseButton
        testID={checksTestIds.notGenuineSheet}
        trackCategory="Device not genuine"
        preset="info"
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
    </Box>
  );
}
