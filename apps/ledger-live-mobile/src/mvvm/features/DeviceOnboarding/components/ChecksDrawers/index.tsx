import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState, type InfoStateCta } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Trans } from "~/context/Locale";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import FirmwareUpdateAvailableDrawer from "LLM/components/FirmwareUpdateAvailableDrawer";
import UnsupportedUpdateDrawer from "LLM/components/UnsupportedUpdateDrawer";
import type { ChecksDrawerProps, DrawerTracking } from "./useChecksDrawers";

export type ChecksDrawerTestIds = Readonly<{
  allowSheet: string;
  declinedSheet: string;
  networkSheet: string;
  unknownSheet: string;
  providerSheet: string;
  notGenuineSheet: string;
}>;

type ChecksDrawersProps = Omit<ChecksDrawerProps, "allowSheet" | "firmwareUpdate"> &
  Readonly<{
    allowSheet?: ChecksDrawerProps["allowSheet"];
    firmwareUpdate?: ChecksDrawerProps["firmwareUpdate"];
    testIds: ChecksDrawerTestIds;
  }>;

type ChecksSheetProps = Readonly<{
  isOpen: boolean;
  onHeaderClosePressed?: () => void;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  testID: string;
  children: React.ReactNode;
}>;

type ChecksInfoSheetProps = DrawerTracking &
  Readonly<{
    isOpen: boolean;
    onDismiss?: () => void;
    onHeaderClosePressed?: () => void;
    showCloseButton?: boolean;
    testID: string;
    preset: "info" | "error";
    title: React.ReactNode;
    description?: React.ReactNode;
    primaryCta: InfoStateCta;
    secondaryCta?: InfoStateCta;
  }>;

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

function ChecksInfoSheet({
  isOpen,
  onDismiss,
  onHeaderClosePressed,
  showCloseButton,
  testID,
  trackName,
  trackCategory,
  trackProps,
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
      onHeaderClosePressed={onHeaderClosePressed}
      showCloseButton={showCloseButton}
      testID={testID}
    >
      {isOpen ? (
        <TrackScreen
          name={trackName}
          category={trackCategory}
          type="drawer"
          refreshSource={false}
          {...trackProps}
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

export function ChecksDrawers({
  testIds,
  allowSheet,
  firmwareUpdate,
  unsupportedUpdate,
  errorDrawer,
  notGenuineDrawer,
}: ChecksDrawersProps) {
  return (
    <>
      {allowSheet ? (
        <ChecksSheet
          isOpen={allowSheet.isOpen}
          onHeaderClosePressed={allowSheet.onClose}
          testID={testIds.allowSheet}
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
          testID={testIds.declinedSheet}
          {...errorDrawer.tracking}
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
          testID={testIds.networkSheet}
          {...errorDrawer.tracking}
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
          testID={testIds.unknownSheet}
          {...errorDrawer.tracking}
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
          secondaryCta={
            errorDrawer.onSkip
              ? {
                  label: <Trans i18nKey="deviceOnboarding.checks.updating.skipCta" />,
                  onPress: errorDrawer.onSkip,
                }
              : {
                  label: <Trans i18nKey="earlySecurityCheck.genuineCheckErrorDrawer.cancelCta" />,
                  onPress: errorDrawer.onCancel,
                }
          }
        />
      ) : null}
      {errorDrawer.kind === "provider" ? (
        <ChecksInfoSheet
          isOpen={errorDrawer.isOpen}
          onDismiss={errorDrawer.onClose}
          testID={testIds.providerSheet}
          {...errorDrawer.tracking}
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
      {firmwareUpdate ? <FirmwareUpdateAvailableDrawer {...firmwareUpdate} /> : null}
      {unsupportedUpdate.mounted ? (
        <UnsupportedUpdateDrawer
          isOpen={unsupportedUpdate.isOpen}
          isUsbRequired={unsupportedUpdate.isUsbRequired}
          productName={unsupportedUpdate.productName}
          onClose={unsupportedUpdate.onClose}
          onClosePressed={unsupportedUpdate.onClosePressed}
        />
      ) : null}
      <ChecksInfoSheet
        isOpen={notGenuineDrawer.isOpen}
        onDismiss={notGenuineDrawer.onClose}
        onHeaderClosePressed={notGenuineDrawer.onClosePressed}
        showCloseButton
        testID={testIds.notGenuineSheet}
        {...notGenuineDrawer.tracking}
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
    </>
  );
}
